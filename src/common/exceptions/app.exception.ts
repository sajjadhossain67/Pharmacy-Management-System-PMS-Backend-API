import {
  HttpException,
  HttpStatus,
} from '@nestjs/common';

// ─── Domain Exceptions ────────────────────────────────────────

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id?: string) {
    super(
      {
        error: 'ResourceNotFound',
        message: id
          ? `${resource} with ID '${id}' not found`
          : `${resource} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resource: string, field: string) {
    super(
      {
        error: 'DuplicateResource',
        message: `${resource} with this ${field} already exists`,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super(
      {
        error: 'InvalidCredentials',
        message: 'Invalid email or password',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class TokenExpiredException extends HttpException {
  constructor() {
    super(
      {
        error: 'TokenExpired',
        message: 'Token is expired or invalid',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InsufficientStockException extends HttpException {
  constructor(medicineName: string, available: number, requested: number) {
    super(
      {
        error: 'InsufficientStock',
        message: `Insufficient stock for ${medicineName}. Available: ${available}, Requested: ${requested}`,
        details: { medicineName, available, requested },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class MedicineExpiredException extends HttpException {
  constructor(medicineName: string, expiryDate: Date) {
    super(
      {
        error: 'MedicineExpired',
        message: `${medicineName} is expired (Expiry: ${new Date(expiryDate).toISOString().slice(0, 10)})`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidOperationException extends HttpException {
  constructor(message: string) {
    super(
      {
        error: 'InvalidOperation',
        message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ForbiddenResourceException extends HttpException {
  constructor(resource?: string) {
    super(
      {
        error: 'Forbidden',
        message: resource
          ? `You do not have permission to access ${resource}`
          : 'You do not have permission to perform this action',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(errors: string[]) {
    super(
      {
        error: 'ValidationFailed',
        message: 'Validation failed',
        errors,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
