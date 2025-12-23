import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Check if API is running' })
  @ApiResponse({
    status: 200, description: 'API is healthy', schema: {
      example: { status: 'ok' }
    }
  })
  health() {
    return { status: 'ok' };
  }
}
