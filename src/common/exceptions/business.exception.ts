import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for business logic errors
 */
export class BusinessException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(
      {
        statusCode,
        message,
        error: 'Business Error',
      },
      statusCode,
    );
  }
}

/**
 * Exception for external API errors (Amadeus, etc.)
 */
export class ExternalApiException extends HttpException {
  constructor(
    message: string,
    public readonly provider: string,
    statusCode: HttpStatus = HttpStatus.SERVICE_UNAVAILABLE,
  ) {
    super(
      {
        statusCode,
        message,
        error: 'External API Error',
        provider,
      },
      statusCode,
    );
  }
}

/**
 * Exception for validation errors
 */
export class ValidationException extends HttpException {
  constructor(message: string, public readonly errors?: any) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Validation Error',
        errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception for not found resources
 */
export class NotFoundException extends HttpException {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
