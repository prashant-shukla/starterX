import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { generateStrongPassword } from '../../shared/utils/password.util';
import { query } from '../../shared/common/db';
import { createErrorResponse } from '../../shared/utils/error-handler';

class CreateUserDto {
  email: string;
  password?: string;
  role?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  status?: string;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {

  @Get()
  @ApiOperation({
    summary: 'List users',
    description: 'Get a list of users (limited to 50)'
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    schema: {
      example: {
        users: [
          { id: 'uuid', email: 'user@example.com', name: 'John Doe', role: 'user', status: 'active' }
        ]
      }
    }
  })
  async list() {
    try {
      const r = await query('SELECT id, email, name, role, status FROM users ORDER BY created_at DESC LIMIT 50');
      return { users: r.rows };
    } catch (e: any) {
      return createErrorResponse(e, 'Failed to retrieve users');
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Create a new user account'
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 200, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Missing email or invalid data' })
  async create(@Body() dto: CreateUserDto) {
    if (!dto.email) {
      return { error: 'Missing email', statusCode: 400 };
    }

    try {
      const plainPassword = dto.password || generateStrongPassword();
      const hash = await bcrypt.hash(plainPassword, 10);

      // Generate name if not provided
      const fullName = dto.name || (dto.first_name && dto.last_name ? `${dto.first_name} ${dto.last_name}` : null);

      const r = await query(
        `INSERT INTO users (id, email, password_hash, role, name, first_name, last_name, status, created_at, updated_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now(), now()) 
         RETURNING id, email, role, name, first_name, last_name, status`,
        [
          dto.email,
          hash,
          dto.role || 'user',
          fullName,
          dto.first_name || null,
          dto.last_name || null,
          dto.status || 'active',
        ]
      );

      const result = r.rows[0];
      
      // Include generated password ONLY if it was auto-generated
      if (!dto.password) {
        result.generated_password = plainPassword;
      }

      return { user: result };
    } catch (e: any) {
      const errorResponse = createErrorResponse(e, 'Failed to create user');
      if (e.message && (
        e.message.includes('duplicate key') ||
        e.message.includes('violates not-null constraint') ||
        e.message.includes('violates check constraint')
      )) {
        errorResponse.statusCode = 400;
      }
      return errorResponse;
    }
  }
}
