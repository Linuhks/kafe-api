import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorDetail {
  field?: string;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: ErrorDetail[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const body = exceptionResponse as Record<string, unknown>;
        message = (body.message as string) ?? message;

        // Validation errors do NestJS (array de mensagens)
        if (Array.isArray(body.message)) {
          message = 'Validation failed';
          details = (body.message as string[]).map((m) => ({ message: m }));
          code = 'VALIDATION_ERROR';
        }
      }

      code = this.statusToCode(status, code);
    }

    response.status(status).json({
      error: {
        code,
        message,
        ...(details ? { details } : {}),
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  private statusToCode(status: number, fallback: string): string {
    const map: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
    };
    return map[status] ?? fallback;
  }
}
