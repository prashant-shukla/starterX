import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { query } from '../shared/common/db';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Setup')
@Controller('setup')
export class SetupController {
  @Get('status')
  @ApiOperation({ summary: 'Get installation status', description: 'Check if the application is properly installed' })
  @ApiResponse({ status: 200, description: 'Installation status' })
  async getStatus(@Res() res: Response) {
    try {
      const status = {
        database: false,
        migrations: false,
        adminUser: false,
        envConfigured: false,
        errors: [] as string[],
      };

      // Check database connection
      try {
        await query('SELECT 1');
        status.database = true;
      } catch (err: any) {
        status.errors.push(`Database connection failed: ${err.message}`);
      }

      // Check if migrations have run (check if users table exists)
      if (status.database) {
        try {
          const result = await query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'users'
            )
          `);
          status.migrations = result.rows[0]?.exists === true;
          if (!status.migrations) {
            status.errors.push('Database migrations have not been run');
          }
        } catch (err: any) {
          status.errors.push(`Failed to check migrations: ${err.message}`);
        }
      }

      // Check if admin user exists
      if (status.migrations) {
        try {
          // Use case-insensitive check and trim whitespace
          const result = await query(`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE LOWER(TRIM(role)) IN ('admin', 'super_admin', 'superadmin', 'administrator')
          `);
          status.adminUser = parseInt(result.rows[0]?.count || '0', 10) > 0;
          // Only show admin user error if migrations have run (meaning setup is in progress)
          // Don't show it as an error if database isn't connected or migrations haven't run
          if (!status.adminUser && status.migrations) {
            // This is informational, not a blocking error
          }
        } catch (err: any) {
          status.errors.push(`Failed to check admin user: ${err.message}`);
        }
      }

      // Check if required env vars are set
      // Only check JWT_SECRET as required (DATABASE_URL has fallback logic)
      const requiredEnvVars: string[] = [];
      
      // JWT_SECRET is required for authentication
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
        requiredEnvVars.push('JWT_SECRET');
      }
      
      // DATABASE_URL is optional if database connection works (has fallback)
      // Only warn if database connection failed AND neither DATABASE_URL nor Supabase vars are set
      if (!status.database) {
        const hasDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';
        const hasSupabaseVars = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                (process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD);
        
        // If neither is set, suggest configuration
        if (!hasDatabaseUrl && !hasSupabaseVars) {
          requiredEnvVars.push('DATABASE_URL');
        } else if (hasSupabaseVars && !hasDatabaseUrl) {
          // Supabase vars are set but connection failed - this is a connection issue, not config issue
          // Don't add to requiredEnvVars, but the error message will show the actual connection error
        }
      }
      
      status.envConfigured = requiredEnvVars.length === 0;
      if (requiredEnvVars.length > 0) {
        status.errors.push(`Missing environment variables: ${requiredEnvVars.join(', ')}`);
      }

      const isInstalled = status.database && status.migrations && status.adminUser && status.envConfigured;

      return res.json({
        installed: isInstalled,
        ...status,
      });
    } catch (err: any) {
      return res.status(500).json({
        installed: false,
        error: err.message || 'Failed to check installation status',
      });
    }
  }

  @Post('run-migrations')
  @ApiOperation({ summary: 'Run database migrations', description: 'Execute database migrations to set up the schema' })
  @ApiResponse({ status: 200, description: 'Migrations completed successfully' })
  @ApiResponse({ status: 500, description: 'Migration failed' })
  async runMigrations(@Res() res: Response) {
    try {
      // Read migration file
      const migrationPath = path.join(process.cwd(), 'migrations', '001_init.sql');
      
      if (!fs.existsSync(migrationPath)) {
        return res.status(404).json({
          success: false,
          error: 'Migration file not found',
        });
      }

      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Execute migration
      await query(migrationSQL);

      return res.json({
        success: true,
        message: 'Migrations completed successfully',
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to run migrations',
      });
    }
  }

  @Post('create-admin')
  @ApiOperation({ summary: 'Create admin user', description: 'Create the initial admin user for the application' })
  @ApiResponse({ status: 200, description: 'Admin user created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 500, description: 'Failed to create admin user' })
  async createAdmin(
    @Body() body: { email: string; password: string; firstName?: string; lastName?: string },
    @Res() res: Response
  ) {
    try {
      const { email, password, firstName = 'Admin', lastName = 'User' } = body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters',
        });
      }

      // Check if user already exists
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists',
        });
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(password, 10);

      // Create super_admin user (first user is always super_admin)
      const result = await query(
        `INSERT INTO users (id, first_name, last_name, email, password_hash, role, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'super_admin', now(), now())
         RETURNING id, email, first_name, last_name, role`,
        [firstName, lastName, email, hash]
      );

      return res.json({
        success: true,
        message: 'Admin user created successfully',
        user: result.rows[0],
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to create admin user',
      });
    }
  }

  @Get('test-database')
  @ApiOperation({ summary: 'Test database connection', description: 'Test if the database connection is working' })
  @ApiResponse({ status: 200, description: 'Database connection successful' })
  @ApiResponse({ status: 500, description: 'Database connection failed' })
  async testDatabase(@Res() res: Response) {
    try {
      const result = await query('SELECT version() as version, current_database() as database');
      return res.json({
        success: true,
        message: 'Database connection successful',
        database: result.rows[0]?.database,
        version: result.rows[0]?.version,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Database connection failed',
      });
    }
  }

  @Get('debug-users')
  @ApiOperation({ summary: 'Debug users', description: 'Get list of all users with their roles for debugging' })
  @ApiResponse({ status: 200, description: 'Users list' })
  async debugUsers(@Res() res: Response) {
    try {
      const result = await query(`
        SELECT id, email, role, first_name, last_name, created_at 
        FROM users 
        ORDER BY created_at DESC
      `);
      return res.json({
        success: true,
        users: result.rows,
        count: result.rows.length,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch users',
      });
    }
  }

  @Get('debug-connection')
  @ApiOperation({ summary: 'Debug database connection', description: 'Get database connection information for debugging' })
  @ApiResponse({ status: 200, description: 'Connection info' })
  async debugConnection(@Res() res: Response) {
    try {
      // Get connection string info (masked)
      const hasDatabaseUrl = !!process.env.DATABASE_URL;
      const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasSupabasePassword = !!(process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD);
      
      let connectionInfo = 'Not set';
      if (hasDatabaseUrl) {
        const masked = process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@') || 'Invalid';
        connectionInfo = `DATABASE_URL: ${masked}`;
      } else if (hasSupabaseUrl && hasSupabasePassword) {
        connectionInfo = `Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/https?:\/\//, '')} (password set)`;
      } else {
        connectionInfo = 'Using fallback: postgres://postgres:****@localhost:5432/postgres';
      }

      // Try to test the connection
      let connectionTest = { success: false, error: '' };
      try {
        const result = await query('SELECT version() as version, current_database() as database');
        connectionTest = {
          success: true,
          error: '',
        };
        return res.json({
          success: true,
          connectionInfo,
          connectionTest: {
            ...connectionTest,
            database: result.rows[0]?.database,
            version: result.rows[0]?.version?.substring(0, 50) + '...',
          },
          envVars: {
            hasDatabaseUrl,
            hasSupabaseUrl,
            hasSupabasePassword,
            nodeEnv: process.env.NODE_ENV || 'not set',
          },
        });
      } catch (err: any) {
        connectionTest = {
          success: false,
          error: err.message || 'Connection failed',
        };
        return res.json({
          success: false,
          connectionInfo,
          connectionTest,
          envVars: {
            hasDatabaseUrl,
            hasSupabaseUrl,
            hasSupabasePassword,
            nodeEnv: process.env.NODE_ENV || 'not set',
          },
          error: err.message,
          errorCode: err.code,
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to debug connection',
      });
    }
  }
}

