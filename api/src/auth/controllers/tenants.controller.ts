import { Controller, Get, Post, Put, Delete, Body, Param, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { query } from '../../shared/common/db';
import { createErrorResponse } from '../../shared/utils/error-handler';
import { AuthRequest, requireSuperAdmin } from '../../shared/common/guards';

class CreateTenantDto {
  name: string;
  slug?: string;
  domain?: string;
  status?: string;
  metadata?: any;
}

class UpdateTenantDto {
  name?: string;
  slug?: string;
  domain?: string;
  status?: string;
  metadata?: any;
}

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {

  @Get()
  @ApiOperation({
    summary: 'List all tenants',
    description: 'Get a list of all tenants (super_admin only)'
  })
  @ApiResponse({
    status: 200,
    description: 'List of tenants',
    schema: {
      example: {
        tenants: [
          { id: 'uuid', name: 'Acme Corp', slug: 'acme', status: 'active', created_at: '2024-01-01T00:00:00Z' }
        ]
      }
    }
  })
  async list(@Req() req: AuthRequest, @Res() res: Response) {
    try {
      const check = await requireSuperAdmin(req, res)
      if (!check.ok) return

      const r = await query(
        'SELECT id, name, slug, domain, status, metadata, created_at, updated_at FROM tenants ORDER BY created_at DESC'
      )
      return res.json({ tenants: r.rows })
    } catch (e: any) {
      return res.status(500).json(createErrorResponse(e, 'Failed to retrieve tenants'))
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get tenant by ID',
    description: 'Get a specific tenant (super_admin only)'
  })
  async get(@Param('id') id: string, @Req() req: AuthRequest, @Res() res: Response) {
    try {
      const check = await requireSuperAdmin(req, res)
      if (!check.ok) return

      const r = await query(
        'SELECT id, name, slug, domain, status, metadata, created_at, updated_at FROM tenants WHERE id = $1',
        [id]
      )
      if (r.rows.length === 0) {
        return res.status(404).json({ error: 'Tenant not found' })
      }
      return res.json({ tenant: r.rows[0] })
    } catch (e: any) {
      return res.status(500).json(createErrorResponse(e, 'Failed to retrieve tenant'))
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new tenant',
    description: 'Create a new tenant/company (super_admin only)'
  })
  @ApiBody({ type: CreateTenantDto })
  @ApiResponse({ status: 200, description: 'Tenant created successfully' })
  @ApiResponse({ status: 400, description: 'Missing name or invalid data' })
  async create(@Body() dto: CreateTenantDto, @Req() req: AuthRequest, @Res() res: Response) {
    if (!dto.name) {
      return res.status(400).json({ error: 'Missing name', statusCode: 400 })
    }

    try {
      const check = await requireSuperAdmin(req, res)
      if (!check.ok) return

      // Generate slug from name if not provided
      const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      
      // Check if slug already exists
      const existing = await query('SELECT id FROM tenants WHERE slug = $1', [slug])
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Slug already exists', statusCode: 400 })
      }

      const r = await query(
        `INSERT INTO tenants (id, name, slug, domain, status, metadata, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now(), now())
         RETURNING id, name, slug, domain, status, metadata, created_at, updated_at`,
        [
          dto.name,
          slug,
          dto.domain || null,
          dto.status || 'active',
          dto.metadata ? JSON.stringify(dto.metadata) : null,
        ]
      )

      return res.json({ tenant: r.rows[0] })
    } catch (e: any) {
      const errorResponse = createErrorResponse(e, 'Failed to create tenant')
      if (e.message && (
        e.message.includes('duplicate key') ||
        e.message.includes('violates not-null constraint') ||
        e.message.includes('violates check constraint')
      )) {
        errorResponse.statusCode = 400
      }
      return res.status(errorResponse.statusCode || 500).json(errorResponse)
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a tenant',
    description: 'Update tenant information (super_admin only)'
  })
  @ApiBody({ type: UpdateTenantDto })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto, @Req() req: AuthRequest, @Res() res: Response) {
    try {
      const check = await requireSuperAdmin(req, res)
      if (!check.ok) return

      // Build update query dynamically
      const updates: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (dto.name !== undefined) {
        updates.push(`name = $${paramIndex++}`)
        params.push(dto.name)
      }
      if (dto.slug !== undefined) {
        updates.push(`slug = $${paramIndex++}`)
        params.push(dto.slug)
      }
      if (dto.domain !== undefined) {
        updates.push(`domain = $${paramIndex++}`)
        params.push(dto.domain)
      }
      if (dto.status !== undefined) {
        updates.push(`status = $${paramIndex++}`)
        params.push(dto.status)
      }
      if (dto.metadata !== undefined) {
        updates.push(`metadata = $${paramIndex++}`)
        params.push(JSON.stringify(dto.metadata))
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      updates.push(`updated_at = now()`)
      params.push(id)

      const r = await query(
        `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIndex}
         RETURNING id, name, slug, domain, status, metadata, created_at, updated_at`,
        params
      )

      if (r.rows.length === 0) {
        return res.status(404).json({ error: 'Tenant not found' })
      }

      return res.json({ tenant: r.rows[0] })
    } catch (e: any) {
      return res.status(500).json(createErrorResponse(e, 'Failed to update tenant'))
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a tenant',
    description: 'Delete a tenant and all associated users (super_admin only)'
  })
  async delete(@Param('id') id: string, @Req() req: AuthRequest, @Res() res: Response) {
    try {
      const check = await requireSuperAdmin(req, res)
      if (!check.ok) return

      // Check if tenant exists
      const checkTenant = await query('SELECT id FROM tenants WHERE id = $1', [id])
      if (checkTenant.rows.length === 0) {
        return res.status(404).json({ error: 'Tenant not found' })
      }

      // Delete tenant (CASCADE will delete associated users)
      await query('DELETE FROM tenants WHERE id = $1', [id])

      return res.json({ success: true, message: 'Tenant deleted successfully' })
    } catch (e: any) {
      return res.status(500).json(createErrorResponse(e, 'Failed to delete tenant'))
    }
  }

  @Get(':id/users')
  @ApiOperation({
    summary: 'Get users for a tenant',
    description: 'Get all users belonging to a specific tenant (super_admin only)'
  })
  async getTenantUsers(@Param('id') id: string, @Req() req: AuthRequest, @Res() res: Response) {
    try {
      const check = await requireSuperAdmin(req, res)
      if (!check.ok) return

      const r = await query(
        'SELECT id, email, name, role, status, first_name, last_name, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
        [id]
      )
      return res.json({ users: r.rows })
    } catch (e: any) {
      return res.status(500).json(createErrorResponse(e, 'Failed to retrieve tenant users'))
    }
  }
}

