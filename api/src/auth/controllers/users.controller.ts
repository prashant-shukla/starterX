import { Controller, Get, Post, Put, Delete, Body, Param, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { generateStrongPassword } from '../../shared/utils/password.util';
import { query } from '../../shared/common/db';
import { createErrorResponse } from '../../shared/utils/error-handler';
import { AuthRequest, requireAdmin, requireAuth, getTenantFilter, canAccessTenant } from '../../shared/common/guards';

class CreateUserDto {
  email: string;
  password?: string;
  role?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  status?: string;
  tenant_id?: string; // Only super_admin can set this
}

class UpdateUserDto {
  email?: string;
  password?: string;
  role?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  status?: string;
  tenant_id?: string; // Only super_admin can set this
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {

  @Get()
  @ApiOperation({
    summary: 'List users',
    description: 'Get a list of users. Super admin sees all users, admin sees only their tenant users.'
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    schema: {
      example: {
        users: [
          { id: 'uuid', email: 'user@example.com', name: 'John Doe', role: 'user', status: 'active', tenant_id: 'uuid' }
        ]
      }
    }
  })
  async list(@Req() req: AuthRequest, @Res() res: Response) {
    try {
      const auth = req.auth
      if (!auth) {
        console.error('[UsersController.list] req.auth is missing')
        return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' })
      }

      // Apply tenant filter based on user role
      const tenantFilter = getTenantFilter(auth)
      const queryParams: any[] = []
      let sql = 'SELECT id, email, name, role, status, tenant_id, first_name, last_name FROM users WHERE 1=1'
      
      if (tenantFilter.sql) {
        sql += ' ' + tenantFilter.sql
        queryParams.push(...tenantFilter.params)
      }
      
      sql += ' ORDER BY created_at DESC LIMIT 50'
      
      const r = await query(sql, queryParams)
      return res.json({ users: r.rows })
    } catch (e: any) {
      return res.status(500).json(createErrorResponse(e, 'Failed to retrieve users'))
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Create a new user account. Admin can create users in their tenant. Super admin can create users in any tenant.'
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 200, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Missing email or invalid data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Body() dto: CreateUserDto, @Req() req: AuthRequest, @Res() res: Response) {
    if (!dto.email) {
      return res.status(400).json({ error: 'Missing email', statusCode: 400 });
    }

    try {
      const auth = req.auth
      if (!auth) {
        console.error('[UsersController] req.auth is missing')
        return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' })
      }

      // Check permissions: Only admin and super_admin can create users
      const adminCheck = await requireAdmin(req, res)
      if (!adminCheck.ok) {
        return // Response already sent by requireAdmin
      }

      // Determine tenant_id
      let tenantId: string | null = null
      if (auth.role === 'super_admin') {
        // Super admin can specify tenant_id, or it defaults to null (no tenant)
        tenantId = dto.tenant_id || null
      } else {
        // Admin can only create users in their own tenant
        tenantId = auth.tenant_id || null
      }

      // Validate role assignment
      let userRole = dto.role || 'user'
      if (auth.role !== 'super_admin') {
        // Regular admin cannot create super_admin or other admins
        if (userRole === 'super_admin' || userRole === 'admin') {
          return res.status(403).json({ error: 'Insufficient permissions to create admin users' })
        }
      }

      const plainPassword = dto.password || generateStrongPassword();
      const hash = await bcrypt.hash(plainPassword, 10);

      // Generate name if not provided
      const fullName = dto.name || (dto.first_name && dto.last_name ? `${dto.first_name} ${dto.last_name}` : null);

      const r = await query(
        `INSERT INTO users (id, email, password_hash, role, name, first_name, last_name, status, tenant_id, created_at, updated_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, now(), now()) 
         RETURNING id, email, role, name, first_name, last_name, status, tenant_id`,
        [
          dto.email,
          hash,
          userRole,
          fullName,
          dto.first_name || null,
          dto.last_name || null,
          dto.status || 'active',
          tenantId,
        ]
      );

      const result = r.rows[0];
      
      // Include generated password ONLY if it was auto-generated
      if (!dto.password) {
        result.generated_password = plainPassword;
      }

      return res.json({ user: result });
    } catch (e: any) {
      const errorResponse = createErrorResponse(e, 'Failed to create user');
      if (e.message && (
        e.message.includes('duplicate key') ||
        e.message.includes('violates not-null constraint') ||
        e.message.includes('violates check constraint')
      )) {
        errorResponse.statusCode = 400;
      }
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a user',
    description: 'Update user information. Admin can update users in their tenant. Super admin can update any user.'
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: AuthRequest, @Res() res: Response) {
    try {
      const auth = req.auth
      if (!auth) {
        console.error('[UsersController] req.auth is missing')
        return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' })
      }

      // Check permissions: Only admin and super_admin can update users
      const adminCheck = await requireAdmin(req, res)
      if (!adminCheck.ok) {
        return
      }

      // Get the user to update
      const userResult = await query('SELECT id, tenant_id, role FROM users WHERE id = $1', [id])
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      const targetUser = userResult.rows[0]

      // Check if user can access this user's tenant
      if (!canAccessTenant(auth, targetUser.tenant_id)) {
        return res.status(403).json({ error: 'Access denied to this user' })
      }

      // Build update query dynamically
      const updates: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (dto.email !== undefined) {
        updates.push(`email = $${paramIndex++}`)
        params.push(dto.email)
      }
      if (dto.first_name !== undefined) {
        updates.push(`first_name = $${paramIndex++}`)
        params.push(dto.first_name)
      }
      if (dto.last_name !== undefined) {
        updates.push(`last_name = $${paramIndex++}`)
        params.push(dto.last_name)
      }
      if (dto.name !== undefined) {
        updates.push(`name = $${paramIndex++}`)
        params.push(dto.name)
      } else if (dto.first_name !== undefined || dto.last_name !== undefined) {
        // Auto-generate name from first_name and last_name
        const firstName = dto.first_name !== undefined ? dto.first_name : targetUser.first_name
        const lastName = dto.last_name !== undefined ? dto.last_name : targetUser.last_name
        updates.push(`name = $${paramIndex++}`)
        params.push(`${firstName} ${lastName}`.trim())
      }
      if (dto.status !== undefined) {
        updates.push(`status = $${paramIndex++}`)
        params.push(dto.status)
      }
      if (dto.password !== undefined) {
        const hash = await bcrypt.hash(dto.password, 10)
        updates.push(`password_hash = $${paramIndex++}`)
        params.push(hash)
      }

      // Role and tenant_id updates require special permission checks
      if (dto.role !== undefined) {
        // Only super_admin can change roles, and cannot change to super_admin
        if (auth.role !== 'super_admin') {
          return res.status(403).json({ error: 'Only super admin can change user roles' })
        }
        if (dto.role === 'super_admin' && targetUser.role !== 'super_admin') {
          return res.status(403).json({ error: 'Cannot assign super_admin role' })
        }
        updates.push(`role = $${paramIndex++}`)
        params.push(dto.role)
      }

      if (dto.tenant_id !== undefined) {
        // Only super_admin can change tenant_id
        if (auth.role !== 'super_admin') {
          return res.status(403).json({ error: 'Only super admin can change user tenant' })
        }
        updates.push(`tenant_id = $${paramIndex++}`)
        params.push(dto.tenant_id || null)
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      updates.push(`updated_at = now()`)
      params.push(id)

      const r = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
         RETURNING id, email, role, name, first_name, last_name, status, tenant_id`,
        params
      )

      return res.json({ user: r.rows[0] })
    } catch (e: any) {
      const errorResponse = createErrorResponse(e, 'Failed to update user')
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

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a user',
    description: 'Delete a user. Admin can delete users in their tenant. Super admin can delete any user.'
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string, @Req() req: AuthRequest, @Res() res: Response) {
    try {
      const auth = req.auth
      if (!auth) {
        console.error('[UsersController] req.auth is missing')
        return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' })
      }

      // Check permissions: Only admin and super_admin can delete users
      const adminCheck = await requireAdmin(req, res)
      if (!adminCheck.ok) {
        return
      }

      // Get the user to delete
      const userResult = await query('SELECT id, tenant_id, role FROM users WHERE id = $1', [id])
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      const targetUser = userResult.rows[0]

      // Prevent deleting super_admin (unless you are super_admin)
      if (targetUser.role === 'super_admin' && auth.role !== 'super_admin') {
        return res.status(403).json({ error: 'Cannot delete super admin user' })
      }

      // Prevent deleting yourself
      if (targetUser.id === auth.sub) {
        return res.status(400).json({ error: 'Cannot delete your own account' })
      }

      // Check if user can access this user's tenant
      if (!canAccessTenant(auth, targetUser.tenant_id)) {
        return res.status(403).json({ error: 'Access denied to this user' })
      }

      await query('DELETE FROM users WHERE id = $1', [id])

      return res.json({ success: true, message: 'User deleted successfully' })
    } catch (e: any) {
      return res.status(500).json(createErrorResponse(e, 'Failed to delete user'))
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Get a specific user. Admin can view users in their tenant. Super admin can view any user.'
  })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async get(@Param('id') id: string, @Req() req: AuthRequest, @Res() res: Response) {
    try {
      const auth = req.auth
      if (!auth) {
        console.error('[UsersController] req.auth is missing')
        return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' })
      }

      const r = await query(
        'SELECT id, email, name, role, status, tenant_id, first_name, last_name, created_at, updated_at FROM users WHERE id = $1',
        [id]
      )

      if (r.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      const user = r.rows[0]

      // Check if user can access this user's tenant
      if (!canAccessTenant(auth, user.tenant_id)) {
        return res.status(403).json({ error: 'Access denied' })
      }

      return res.json({ user })
    } catch (e: any) {
      return res.status(500).json(createErrorResponse(e, 'Failed to retrieve user'))
    }
  }
}
