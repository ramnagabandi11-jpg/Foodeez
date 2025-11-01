import { HTTP_STATUS, ERROR_CODES } from '@/utils/constants';

export interface ErrorDetail {
  field: string;
  message: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ErrorDetail[];

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_ERROR,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    details?: ErrorDetail[]
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);

    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details })
      }
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: ErrorDetail[]) {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      details
    );
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(
      message,
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED
    );
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(
      message,
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN
    );
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(
      message,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND
    );
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: string = ERROR_CODES.CONFLICT) {
    super(
      message,
      HTTP_STATUS.CONFLICT,
      code
    );
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(
      message,
      HTTP_STATUS.RATE_LIMITED,
      ERROR_CODES.RATE_LIMITED
    );
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(
      message,
      HTTP_STATUS.INTERNAL_ERROR,
      ERROR_CODES.INTERNAL_ERROR
    );
    Object.setPrototypeOf(this, InternalError.prototype);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(
      message,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.SERVICE_UNAVAILABLE
    );
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid credentials') {
    super(
      message,
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_CREDENTIALS
    );
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

export class InvalidOTPError extends AppError {
  constructor(message: string = 'Invalid or expired OTP') {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_OTP
    );
    Object.setPrototypeOf(this, InvalidOTPError.prototype);
  }
}

export class UserNotFoundError extends AppError {
  constructor(message: string = 'User not found') {
    super(
      message,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND
    );
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class PaymentFailedError extends AppError {
  constructor(message: string = 'Payment processing failed') {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.PAYMENT_FAILED
    );
    Object.setPrototypeOf(this, PaymentFailedError.prototype);
  }
}

export class InsufficientWalletBalanceError extends AppError {
  constructor(message: string = 'Insufficient wallet balance') {
    super(
      message,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.INSUFFICIENT_WALLET_BALANCE
    );
    Object.setPrototypeOf(this, InsufficientWalletBalanceError.prototype);
  }
}
