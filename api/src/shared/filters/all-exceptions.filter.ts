import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status: number;
    let message: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? { error: res } : res;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = { error: 'Internal server error' };
      // Optionally include original error message for non-production
      if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
        message.details = exception.message;
      }
    }

    // Standard response envelope
    const payload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...message,
    };

    response.status(status).json(payload);
  }
}
