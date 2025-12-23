declare module 'pg' {
  export interface PoolClient {
    query(queryText: string, params?: any[]): Promise<{ rows: any[] }>
    release(): void
  }

  export class Pool {
    constructor(config?: any)
    query(queryText: string, params?: any[]): Promise<{ rows: any[] }>
    connect(): Promise<PoolClient>
    end(): Promise<void>
    on(event: string, handler: (...args: any[]) => void): void
  }
}
