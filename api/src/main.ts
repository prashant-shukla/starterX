import { NestFactory } from '@nestjs/core';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';
import { jwtMiddleware } from './shared/common/jwt.middleware';

async function bootstrap() {
  const quiet = process.env.QUIET_LOGS === 'true';
  const app = await NestFactory.create(AppModule, { 
    logger: quiet ? ['error'] : ['error', 'warn', 'log'] 
  });
  
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors();

  // Configure Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Health', 'System health checks')
    .addTag('Users', 'User management')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your JWT token from POST /auth/login'
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Parse JSON and urlencoded bodies
  const server = app.getHttpAdapter().getInstance();
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));
  
  // Apply JWT middleware globally via Express (before NestJS routing)
  // This ensures it runs for all routes and req.auth is properly set
  // The middleware will handle public routes internally
  server.use(jwtMiddleware);

  // Serve uploaded files from /uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  server.use('/uploads', express.static(uploadsDir));

  // Choose initial port from env or default 4000
  const startPort = parseInt(process.env.PORT || '4000', 10) || 4000;
  const maxAttempts = 50;
  let boundPort: number | null = null;

  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    try {
      await app.listen(port);
      boundPort = port;
      if (!quiet) {
        console.log(`🚀 Server running on http://localhost:${port}`);
        console.log(`📚 API docs available at http://localhost:${port}/api-docs`);
      }
      break;
    } catch (err: any) {
      if (err && (err.code === 'EADDRINUSE' || err.message?.includes('EADDRINUSE'))) {
        if (!quiet && i === 0) {
          console.warn(`Port ${port} is in use, trying ${port + 1}...`);
        }
        continue;
      }
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  }

  if (!boundPort) {
    console.error(`Could not bind to a port in range ${startPort}..${startPort + maxAttempts - 1}`);
    process.exit(1);
  }

  // Write the bound port to web/.api_port so the frontend can read it
  try {
    const fs = require('fs');
    const apiPortFile = path.join(process.cwd(), '..', 'web', '.api_port');
    fs.writeFileSync(apiPortFile, String(boundPort), { encoding: 'utf8' });

    const cleanup = () => {
      try { fs.unlinkSync(apiPortFile); } catch (e) { /* ignore */ }
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', () => { 
      try { fs.unlinkSync(apiPortFile); } catch (e) { } 
    });
  } catch (e) {
    if (!quiet) {
      console.warn('Could not write API port file:', e);
    }
  }
}

bootstrap();
