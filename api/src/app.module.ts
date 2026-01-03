import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './health/app.controller';
import { AuthController } from './auth/controllers/auth.controller';
import { UsersController } from './auth/controllers/users.controller';
import { SetupController } from './setup/setup.controller';
import { jwtMiddleware } from './shared/common/jwt.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().optional(),
        JWT_SECRET: Joi.string().optional(),
        PORT: Joi.number().optional(),
        QUIET_LOGS: Joi.string().valid('true', 'false').optional(),
      })
    })
  ],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    SetupController,
  ],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(jwtMiddleware)
      .exclude('/auth', '/', '/setup')
      .forRoutes('*');
  }
}
