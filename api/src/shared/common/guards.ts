import { query } from './db'
import { Response } from 'express'
import { AuthRequest } from './jwt.middleware'

export async function ensureAdminOrBootstrap(req: any, res: any) {
  try {
    const r = await query("SELECT id FROM users WHERE role IN ('admin', 'super_admin') LIMIT 1")
    const adminExists = r.rows.length > 0
    if (!adminExists) return { ok: true }
    const auth = req.auth
    if (!auth) return { ok: false, error: 'Authentication required' }
    if (auth.role !== 'admin' && auth.role !== 'super_admin') return { ok: false, error: 'Admin role required' }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message || String(e) }
  }
}

/**
 * Guard: Ensure user is super_admin (can manage all tenants)
 */
export async function requireSuperAdmin(req: AuthRequest, res: Response): Promise<{ ok: boolean; error?: string }> {
  const auth = req.auth
  if (!auth) {
    console.error('[requireSuperAdmin] req.auth is missing', { path: req.path || req.url, hasHeaders: !!req.headers })
    res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' })
    return { ok: false, error: 'Authentication required' }
  }
  if (auth.role !== 'super_admin') {
    res.status(403).json({ error: 'Super admin access required' })
    return { ok: false, error: 'Super admin access required' }
  }
  return { ok: true }
}

/**
 * Guard: Ensure user is admin or super_admin (can manage their tenant)
 */
export async function requireAdmin(req: AuthRequest, res: Response): Promise<{ ok: boolean; error?: string }> {
  const auth = req.auth
  if (!auth) {
    console.error('[requireAdmin] req.auth is missing', { path: req.path || req.url, hasHeaders: !!req.headers })
    res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' })
    return { ok: false, error: 'Authentication required' }
  }
  if (auth.role !== 'admin' && auth.role !== 'super_admin') {
    res.status(403).json({ error: 'Admin access required' })
    return { ok: false, error: 'Admin access required' }
  }
  return { ok: true }
}

/**
 * Guard: Ensure user is authenticated (any role)
 */
export async function requireAuth(req: AuthRequest, res: Response): Promise<{ ok: boolean; error?: string }> {
  const auth = req.auth
  if (!auth) {
    console.error('[requireAuth] req.auth is missing', { path: req.path || req.url, hasHeaders: !!req.headers })
    res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' })
    return { ok: false, error: 'Authentication required' }
  }
  return { ok: true }
}

/**
 * Check if user can access a specific tenant
 * - super_admin can access any tenant
 * - admin can only access their own tenant
 * - user can only access their own tenant
 */
export function canAccessTenant(auth: { role?: string; tenant_id?: string }, targetTenantId: string | null | undefined): boolean {
  if (!auth) return false
  if (auth.role === 'super_admin') return true
  if (!targetTenantId || !auth.tenant_id) return false
  return auth.tenant_id === targetTenantId
}

/**
 * Get tenant filter for queries based on user role
 * - super_admin: no filter (can see all)
 * - admin/user: filter by their tenant_id
 */
export function getTenantFilter(auth: { role?: string; tenant_id?: string }): { sql: string; params: any[] } {
  if (auth?.role === 'super_admin') {
    return { sql: '', params: [] }
  }
  if (auth?.tenant_id) {
    return { sql: 'AND tenant_id = $1', params: [auth.tenant_id] }
  }
  return { sql: 'AND tenant_id IS NULL', params: [] }
}

export default { ensureAdminOrBootstrap, requireSuperAdmin, requireAdmin, requireAuth, canAccessTenant, getTenantFilter }
