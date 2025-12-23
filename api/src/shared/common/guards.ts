import { query } from './db'

export async function ensureAdminOrBootstrap(req: any, res: any) {
  try {
    const r = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    const adminExists = r.rows.length > 0
    if (!adminExists) return { ok: true }
    const auth = req.auth
    if (!auth) return { ok: false, error: 'Authentication required' }
    if (auth.role !== 'admin') return { ok: false, error: 'Admin role required' }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message || String(e) }
  }
}

export default { ensureAdminOrBootstrap }
