import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter for consistent error responses
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = this.buildErrorResponse(exception, request, status);

    // Log error with context
    this.logError(exception, request, status);

    response.status(status).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request, status: number) {
    const timestamp = new Date().toISOString();
    const path = request.url;

    // Handle HttpException
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        return {
          ...exceptionResponse,
          timestamp,
          path,
        };
      }

      return {
        statusCode: status,
        message: exceptionResponse,
        timestamp,
        path,
      };
    }

    // Handle unknown errors
    return {
      statusCode: status,
      message: 'Internal server error. Please try again later.',
      timestamp,
      path,
    };
  }

  private logError(exception: unknown, request: Request, status: number) {
    const { method, url, body, query, params } = request;

    // Only log stack trace for 500 errors
    if (status >= 500) {
      this.logger.error(
        `${method} ${url} ${status}`,
        exception instanceof Error ? exception.stack : 'No stack trace',
        JSON.stringify({
          body,
          query,
          params,
        }),
      );
    } else {
      this.logger.warn(
        `${method} ${url} ${status} - ${
          exception instanceof Error ? exception.message : 'Unknown error'
        }`,
      );
    }
  }
}
