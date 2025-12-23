import { NextFunction, Request as ERequest, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { query } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me'

export interface AuthRequest extends ERequest {
  auth?: { sub: string; user_id?: string; email?: string; role?: string }
}

export async function jwtMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const r: any = req
  const path = r.path || r.url || ''
  
  // Allow OPTIONS requests
  if (req.method === 'OPTIONS') return next()
  
  // Allow public routes
  if ((path || '').startsWith('/auth') || path === '/') return next()
  if (req.method === 'GET' && (path === '/uploads' || path.startsWith('/uploads/'))) return next()

  // Check for Bearer token
  const auth = (r.headers && (r.headers.authorization || r.headers.Authorization)) || null
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization' })
  }
  
  const token = auth.slice('Bearer '.length)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const sub = decoded.sub
    
    try {
      const r = await query('SELECT id, role FROM users WHERE id = $1 LIMIT 1', [sub])
      const u = r.rows[0]
      req.auth = { sub, user_id: u?.id || sub, email: decoded.email, role: u?.role }
    } catch (e) {
      req.auth = { sub, user_id: sub, email: decoded.email }
    }
    
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export default jwtMiddleware
