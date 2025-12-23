import { Pool, PoolClient } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

let pool: Pool | null = null
let poolInitError: Error | null = null
const isProd = process.env.NODE_ENV === 'production'

function getConnectionString(): string {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabasePassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD
    let connectionString = process.env.DATABASE_URL
    if (!connectionString && supabaseUrl && supabasePassword) {
      const urlObj = new URL(supabaseUrl)
      const supabaseHost = urlObj.hostname
      const projectRef = supabaseHost.split('.')[0]
      connectionString = `postgresql://postgres:${encodeURIComponent(supabasePassword)}@db.${projectRef}.supabase.co:5432/postgres`
      if (!isProd) console.log('Built DATABASE_URL from Supabase env vars')
    }
    if (!connectionString) {
      connectionString = 'postgres://postgres:postgres@localhost:5432/synoro'
      if (!isProd) console.warn('Using fallback local DATABASE_URL')
    }
    if (!isProd && connectionString && connectionString !== 'postgres://postgres:postgres@localhost:5432/synoro') {
      // Log connection info (mask password) for debugging
      const masked = connectionString.replace(/:([^:@]+)@/, ':****@')
      console.log('Using DATABASE_URL:', masked)
    }
    return connectionString
  } catch (err: any) {
    console.error('Error building connection string:', err.message)
    return 'postgres://postgres:postgres@localhost:5432/synoro'
  }
}

function getPool(): Pool {
  if (poolInitError) throw poolInitError
  if (pool) return pool
  try {
    const connectionString = getConnectionString()
    const poolConfig: any = {
      connectionString,
      max: Number(process.env.PG_MAX_CLIENTS) || 20,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 60000,
      acquireTimeoutMillis: 60000,
      keepAlive: true,
      allowExitOnIdle: true,
      statement_timeout: 30000,
      query_timeout: 30000,
      // Explicitly set client encoding to UTF-8 for proper character support
      options: '-c client_encoding=UTF8',
    }
    if (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')) {
      poolConfig.ssl = { rejectUnauthorized: false }
    }
    const usesSessionMode =
      connectionString.toLowerCase().includes('pgbouncer=true') ||
      connectionString.toLowerCase().includes('session=') ||
      process.env.PG_SESSION_MODE === 'true'
    if (usesSessionMode) {
      const sessionPoolSize = Number(process.env.PG_SESSION_MAX_CLIENTS) || 1
      poolConfig.max = Math.min(poolConfig.max, sessionPoolSize)
      poolConfig.min = Math.min(poolConfig.min, poolConfig.max)
      if (poolConfig.min === 0) delete poolConfig.min
    }
    pool = new Pool(poolConfig)
    pool.on('error', (err: any) => { console.error('Unexpected idle client error', err) })
    return pool
  } catch (err: any) {
    poolInitError = err
    console.error('Failed to initialize database pool:', err.message)
    throw err
  }
}

export async function query(text: string, params?: any[]) {
  try {
    const p = getPool()
    return await p.query(text, params)
  } catch (error: any) {
    // Log more detailed error information for debugging connection issues
    const errorDetails = {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port,
      query: text.substring(0, 100) + '...',
      params: params?.length || 0
    }
    console.error('Database query error:', errorDetails)
    throw error
  }
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const p = getPool()
  const client = await p.connect()
  try {
    await client.query('BEGIN')
    const res = await fn(client)
    await client.query('COMMIT')
    return res
  } catch (err) {
    try { await client.query('ROLLBACK') } catch (e) { }
    throw err
  } finally {
    client.release()
  }
}
