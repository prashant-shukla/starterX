import { NextFunction, Request as ERequest, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { query } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me'

export interface AuthRequest extends ERequest {
  auth?: { sub: string; user_id?: string; email?: string; role?: string; tenant_id?: string }
}

export async function jwtMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  console.log('[jwtMiddleware] ===== MIDDLEWARE CALLED =====')
  const r: any = req
  const path = r.path || r.url || r.originalUrl || ''
  
  console.log('[jwtMiddleware] Request received', { 
    method: req.method, 
    path, 
    originalUrl: r.originalUrl,
    url: r.url,
    baseUrl: r.baseUrl,
    route: r.route?.path,
    hasAuthHeader: !!(r.headers && (r.headers.authorization || r.headers.Authorization)),
    authHeaderValue: r.headers?.authorization || r.headers?.Authorization ? 'present' : 'missing'
  })
  
  // Allow OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('[jwtMiddleware] OPTIONS request - allowing')
    return next()
  }
  
  // Allow public routes
  if ((path || '').startsWith('/auth') || path === '/') {
    console.log('[jwtMiddleware] Public route - allowing', { path })
    return next()
  }
  if (req.method === 'GET' && (path === '/uploads' || path.startsWith('/uploads/'))) {
    console.log('[jwtMiddleware] Upload route - allowing', { path })
    return next()
  }

  // Check for Bearer token
  const auth = (r.headers && (r.headers.authorization || r.headers.Authorization)) || null
  if (!auth || !auth.startsWith('Bearer ')) {
    console.error('[jwtMiddleware] Missing Authorization header', { path, method: req.method, headers: Object.keys(r.headers || {}) })
    return res.status(401).json({ error: 'Missing Authorization', code: 'MISSING_AUTH' })
  }
  
  const token = auth.slice('Bearer '.length)
  
  if (!token || token.trim().length === 0) {
    return res.status(401).json({ error: 'Missing token', code: 'MISSING_TOKEN' })
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const sub = decoded.sub
    
    if (!sub) {
      console.error('[jwtMiddleware] Token missing user ID (sub)')
      return res.status(401).json({ error: 'Invalid token: missing user ID', code: 'INVALID_TOKEN' })
    }
    
    try {
      const userResult = await query('SELECT id, role, tenant_id FROM users WHERE id = $1 LIMIT 1', [sub])
      const u = userResult.rows[0]
      
      if (!u) {
        console.error(`[jwtMiddleware] User not found in database: ${sub} (from token)`)
        return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' })
      }
      
      // Set auth on request object - ensure it's set on both req and r for compatibility
      const authData = { 
        sub, 
        user_id: u.id, 
        email: decoded.email, 
        role: u.role,
        tenant_id: u.tenant_id || decoded.tenant_id
      }
      req.auth = authData
      r.auth = authData  // Also set on the raw request object
      
      console.log('[jwtMiddleware] Authentication successful', { 
        userId: u.id, 
        role: u.role, 
        tenantId: u.tenant_id,
        path: path,
        authSet: !!req.auth,
        rawAuthSet: !!r.auth
      })
    } catch (e: any) {
      // Database error - log it but don't expose details
      console.error('[jwtMiddleware] Database error:', e.message, 'User ID:', sub)
      return res.status(401).json({ error: 'Authentication failed', code: 'DB_ERROR' })
    }
    
    return next()
  } catch (err: any) {
    // JWT verification failed
    console.error('[jwtMiddleware] JWT verification error:', err.name, err.message)
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN', details: err.message })
    }
    return res.status(401).json({ error: 'Invalid token', code: 'AUTH_ERROR', details: err.message })
  }
}

export default jwtMiddleware
