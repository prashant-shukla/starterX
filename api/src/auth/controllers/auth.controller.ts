import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken'
import { query } from '../../shared/common/db'
import { ensureAdminOrBootstrap } from '../../shared/common/guards'

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me'

class LoginDto {
  email: string;
  password: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  @Post('login')
  @ApiOperation({ summary: 'User login', description: 'Authenticate user and return JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200, description: 'Login successful', schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: { id: 'uuid', email: 'user@example.com', user_metadata: { role: 'client' } }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Missing email or password' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const { email, password } = body || {}
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' })
    if (JWT_SECRET === 'replace-me') {
      return res.status(500).json({ error: 'Server misconfiguration: JWT secret missing' })
    }
    try {
      const result = await query('SELECT id, email, password_hash, role, first_name, last_name, tenant_id FROM users WHERE email = $1 LIMIT 1', [email])
      const row = result.rows[0]
      if (!row) return res.status(401).json({ error: 'Invalid credentials' })

      const ok = await bcrypt.compare(password, row.password_hash || '')
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

      const userMetadata = { role: row.role, tenant_id: row.tenant_id }
      const token = jwt.sign({ 
        sub: row.id, 
        email: row.email, 
        role: row.role,
        tenant_id: row.tenant_id 
      }, JWT_SECRET, { expiresIn: '8h' })
      return res.json({ 
        access_token: token, 
        user: { 
          id: row.id, 
          email: row.email, 
          first_name: row.first_name, 
          last_name: row.last_name,
          tenant_id: row.tenant_id,
          user_metadata: userMetadata 
        } 
      })
    } catch (err: any) {
      const msg = err?.message || ''
      // Common Postgres errors
      if (/relation .* does not exist/i.test(msg)) {
        return res.status(500).json({ error: 'Database schema missing (run migrations)', code: 'DB_SCHEMA_MISSING' })
      }
      if (/password authentication failed/i.test(msg)) {
        return res.status(503).json({ error: 'Database auth failed', code: 'DB_AUTH_FAILED' })
      }
      if (/getaddrinfo ENOTFOUND|ECONNREFUSED|timeout|remaining connection slots|connect ECONNREFUSED/i.test(msg)) {
        // Check what connection method is being used
        const hasDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';
        const hasSupabaseVars = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                (process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD);
        
        let errorMsg = 'Database unreachable. ';
        if (hasDatabaseUrl) {
          errorMsg += 'Check your DATABASE_URL connection string and ensure the database server is running.';
        } else if (hasSupabaseVars) {
          errorMsg += 'Supabase credentials are configured but connection failed. Check your Supabase project status and credentials.';
        } else {
          errorMsg += 'Please configure DATABASE_URL in api/.env or set up Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD).';
        }
        
        return res.status(503).json({ 
          error: errorMsg, 
          code: 'DB_UNREACHABLE',
          details: process.env.NODE_ENV === 'development' ? msg : undefined
        })
      }
      return res.status(500).json({ error: 'Internal login error', code: 'LOGIN_DB_ERROR' })
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout', description: 'Logout user (client-side token removal)' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Req() req: Request, @Res() res: Response) {
    // Stateless JWT - client discards token. Optionally implement blacklist.
    return res.json({ success: true })
  }

  @Post('setup-admin')
  @ApiOperation({ summary: 'Setup admin user', description: 'Create or update admin user (bootstrap endpoint)' })
  @ApiResponse({ status: 200, description: 'Admin user created/updated successfully' })
  @ApiResponse({ status: 403, description: 'Admin already exists and authentication required' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async setupAdmin(@Res() res: Response) {
    // Create or upsert a demo admin user. Uses env vars or defaults. Intended for local/demo use only.
    const email = process.env.ADMIN_EMAIL || 'admin@starterx.com'
    const username = process.env.ADMIN_USERNAME || 'admin'
    const password = process.env.ADMIN_PASSWORD || 'admin123'
    const first = process.env.ADMIN_FIRST || 'Admin'
    const last = process.env.ADMIN_LAST || 'User'
    const role = process.env.ADMIN_ROLE || 'super_admin'

    const hash = await bcrypt.hash(password, 10)
    const sql = `
      INSERT INTO users (id, first_name, last_name, email, username, password_hash, role, date_joined)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now())
      ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role
      RETURNING id
    `

    try {
      // Check whether we need to enforce admin-only access (if an admin already exists)
      const fakeReq: any = {} // when called via POST /auth/setup-admin with no auth, guards will check DB
      const guard = await ensureAdminOrBootstrap(fakeReq, res)
      if (!guard.ok) return res.status(403).json({ success: false, error: guard.error })

      const r = await query(sql, [first, last, email, username, hash, role])
      return res.json({ success: true, id: r.rows[0]?.id })
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || String(err) })
    }
  }
}
