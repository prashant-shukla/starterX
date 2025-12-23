import React, { createContext, useContext, useState, useEffect } from 'react'
export * as AdminAPI from './api-admin'
export * as ContractorAPI from './api-contractor'
export * as ClientAPI from './api-client'

// Backwards-compatible named exports for existing imports across the codebase
export { sendChatMessage, fetchDashboardData, fetchChatHistory } from './api-admin'
export { fetchWorkflowsForClient, fetchTasks, updateTask, fetchDocuments, uploadDocument } from './api-contractor'
export { listClients, getClient, createClient, updateClient, deleteCompany, fetchClientSummaries } from './api-client'

type AuthContextType = {
  accessToken: string | null
  user: any | null
  isLoading: boolean
  setToken: (t: string | null) => void
  setUser: (u: any | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUserState] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('synoro_token') : null
      const u = typeof window !== 'undefined' ? localStorage.getItem('synoro_user') : null


      // Check if token is expired before setting it
      if (token && isTokenExpired(token)) {
        clearAuthAndRedirect()
        return
      }

      if (token) {
        setAccessToken(token)
      }
      if (u) {
        try { 
          const user = JSON.parse(u)
          setUserState(user)
        } catch (e) { 
          console.error('AuthProvider: Error parsing user data', e)
        }
      }
    } catch (e) {
      console.error('AuthProvider: Error restoring auth state', e)
    }

    // Mark loading as complete
    setIsLoading(false)
  }, [])

  // Check token expiration periodically
  useEffect(() => {
    if (!accessToken) return

    const checkTokenExpiration = () => {
      if (isTokenExpired(accessToken)) {
        clearAuthAndRedirect()
      }
    }

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [accessToken])

  const setToken = (t: string | null) => {
    try {
      if (t) localStorage.setItem('synoro_token', t)
      else localStorage.removeItem('synoro_token')
    } catch (e) {}
    setAccessToken(t)
  }

  const setUser = (u: any | null) => {
    try {
      if (u) localStorage.setItem('synoro_user', JSON.stringify(u))
      else localStorage.removeItem('synoro_user')
    } catch (e) {}
    setUserState(u)
  }

  return (
    <AuthContext.Provider value={{ accessToken, user, isLoading, setToken, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Helper function to check if token is expired
export function isTokenExpired(token: string): boolean {
  try {
    if (!token || token.trim().length === 0) {
      return true
    }
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.warn('Invalid token format')
      return true
    }
    const payload = JSON.parse(atob(parts[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    const isExpired = payload.exp < currentTime
    if (isExpired) {
      // token expired; caller will handle logout
    }
    return isExpired
  } catch (e) {
    console.error('Error checking token expiration:', e)
    return true // If we can't parse the token, consider it expired
  }
}

// Helper function to clear auth data and redirect
export function clearAuthAndRedirect() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('synoro_token')
      localStorage.removeItem('synoro_user')

      // Show a toast notification if available
      try {
        const { toast } = require('sonner')
        toast.error('Session expired. Please log in again.')
      } catch (e) {
        // Sonner not available, ignore
      }

      window.location.href = '/login'
    }
  } catch (e) {
    console.error('Error during logout:', e)
  }
}

// keep file as an aggregator for convenience; portal-specific APIs are exported under namespaces

// Default export kept for backwards compatibility with code that imports * as apiClients
import * as _ClientAPI from './api-client'
import * as _ContractorAPI from './api-contractor'
import * as _AdminAPI from './api-admin'
export default {
  ..._ClientAPI,
  ..._ContractorAPI,
  ..._AdminAPI,
  apiRequest,
}

// Core low-level API utilities: BASE_API_URL, apiFetch, apiRequest
const env = (import.meta as any).env || {}
// Use /api for both dev and prod - Vite proxy handles dev, Vercel handles prod
export const BASE_API_URL = env.VITE_API_BASE || env.VITE_API_BASE_URL || '/api'

// Cache the API port to avoid multiple .api_port calls
let cachedApiPort: number | null = null
let portCachePromise: Promise<number | null> | null = null

export async function apiFetch(path: string, options: RequestInit = {}) {
  // If BASE_API_URL is a relative path (starts with /), use it directly (for Vite proxy or production)
  // Otherwise, try to discover the backend port for localhost connections
  const bases: string[] = []
  const isRelativePath = BASE_API_URL.startsWith('/')

  try {
    if (isRelativePath) {
      // Relative path (e.g., /api) - use as-is, Vite proxy or Vercel will handle routing
      bases.push(BASE_API_URL)
    } else {
      // Absolute URL - check if it's localhost and try port discovery
      const isDevelopment = (import.meta as any).env?.DEV || BASE_API_URL.includes('localhost') || BASE_API_URL.includes('127.0.0.1')

      if (isDevelopment && typeof window !== 'undefined') {
        const localhostMatch = BASE_API_URL.match(/^(https?:\/\/localhost)(?::(\d+))?/) || BASE_API_URL.match(/^(https?:\/\/127\.0\.0\.1)(?::(\d+))?/) 
        if (localhostMatch) {
          const prefix = localhostMatch[1]

          // Use cached port or fetch it once
          let apiPort: number | null = null
          if (cachedApiPort !== null) {
            apiPort = cachedApiPort
          } else if (portCachePromise) {
            apiPort = await portCachePromise
          } else {
            // Create a single promise to fetch the port
            portCachePromise = (async () => {
              try {
                const ptext = await fetch('/.api_port', { cache: 'no-store' }).then(r => r.text()).catch(() => '')
                const pnum = parseInt((ptext || '').trim() || '', 10)
                if (!Number.isNaN(pnum)) {
                  cachedApiPort = pnum
                  return pnum
                }
              } catch (e) {
                // ignore reading errors
              }
              return null
            })()
            apiPort = await portCachePromise
          }

          if (apiPort) {
            bases.push(`${prefix}:${apiPort}`)
          } else {
            // If no .api_port, fall back to the local port range around configured port
            const startPort = parseInt(localhostMatch[2] || '4000', 10)
            const attempts = 11 // try startPort .. startPort+10
            for (let i = 0; i < attempts; i++) bases.push(`${prefix}:${startPort + i}`)
          }
        } else {
          bases.push(BASE_API_URL)
        }
      } else {
        // Production or non-localhost URL - use as-is
        bases.push(BASE_API_URL)
      }
    }
  } catch (e) {
    bases.push(BASE_API_URL)
  }

  let lastErr: any = null
  for (const b of bases) {
    const url = `${b}${path}`
    try {
      const resp = await fetch(url, options)
      return resp
    } catch (err: any) {
      lastErr = err
      // try next base
      console.warn(`apiFetch: failed to fetch ${url}: ${err?.message || err}`)
      continue
    }
  }

  throw lastErr || new Error('apiFetch failed')
}

const BASE_URL = `${BASE_API_URL}`

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`
  // minimal logs kept
  const response = await apiFetch(url.replace(BASE_URL, ''), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  let responseData
  try { responseData = await response.json() } catch (e) { responseData = {} }

  if (!response.ok) {
    // Handle 401 Unauthorized - only logout if token is actually expired
    if (response.status === 401) {
      // Don't redirect on login endpoint - let the login form handle the error
      const isLoginEndpoint = endpoint === '/auth/login' || endpoint.includes('/auth/login')
      
      // Extract token from request headers
      let token: string | null = null
      try {
        const headers = options.headers as any
        if (headers) {
          // Headers can be Headers object, plain object, or array
          if (headers instanceof Headers) {
            token = headers.get('Authorization')?.replace('Bearer ', '') || null
          } else if (typeof headers === 'object') {
            // Try both cases
            token = headers['Authorization'] || headers['authorization'] || null
            if (typeof token === 'string') {
              token = token.replace('Bearer ', '')
            }
          }
        }
      } catch (e) {
        console.warn('Error extracting token from headers:', e)
      }
      
      // If no token in request, check localStorage
      if (!token && typeof window !== 'undefined') {
        try {
          token = localStorage.getItem('synoro_token')
        } catch (e) {
          // Ignore localStorage errors
        }
      }
      
      // Only logout if token is expired and it's not a login attempt
      if (token && isTokenExpired(token) && !isLoginEndpoint) {
        console.warn('401 received and token is expired - logging out')
        clearAuthAndRedirect()
        throw new Error('Authentication expired. Please log in again.')
      } else if (token && !isLoginEndpoint) {
        // Token is still valid but got 401 - might be permission issue
        console.warn('401 received but token appears valid - might be permission issue for:', endpoint)
        throw new Error(responseData.error || 'Unauthorized. You may not have permission to access this resource.')
      } else {
        // No token at all OR it's a login endpoint - don't redirect, just throw error
        if (isLoginEndpoint) {
          // For login attempts, just throw the error without redirecting
          throw new Error(responseData.error || 'Invalid email or password. Please try again.')
        } else {
          // No token and not login - redirect to login
          console.warn('401 received with no token - redirecting to login')
          clearAuthAndRedirect()
          throw new Error('Authentication required. Please log in again.')
        }
      }
    }


    // preserve chat special-case
    if (endpoint === '/chat' && responseData?.response) {
      class ApiError extends Error { response: any; status: number; constructor(message: string, responseData: any, status: number) { super(message); this.name='ApiError'; this.response=responseData; this.status=status } }
      throw new ApiError(responseData.error || `Request failed: ${response.status}`, responseData.response, response.status)
    }
    
    // For QuickBooks endpoints, attach full response data so error code can be read
    if (endpoint.includes('quickbooks')) {
      class ApiError extends Error { response: any; status: number; constructor(message: string, responseData: any, status: number) { super(message); this.name='ApiError'; this.response=responseData; this.status=status } }
      throw new ApiError(responseData.error || `Request failed: ${response.status}`, responseData, response.status)
    }
    
    throw new Error(responseData.error || `Request failed: ${response.status}`)
  }

  // Check for error in response even if status is 200 (some endpoints return errors in 200 responses)
  if (responseData && typeof responseData === 'object' && 'error' in responseData) {
    // For QuickBooks endpoints, attach full response data so error code can be read
    if (endpoint.includes('quickbooks')) {
      class ApiError extends Error { response: any; status: number; constructor(message: string, responseData: any, status: number) { super(message); this.name='ApiError'; this.response=responseData; this.status=status } }
      throw new ApiError(responseData.error || 'An error occurred', responseData, 200)
    }
    // If there's an error field, throw an error so it can be caught by the caller
    throw new Error(responseData.error || 'An error occurred')
  }

  // Normalize certain backend wrappers: if responseData.data exists, return as-is
  // so callers expecting { data: ... } can access fields consistently.
  if (responseData && typeof responseData === 'object' && 'data' in responseData) return responseData

  return responseData
}