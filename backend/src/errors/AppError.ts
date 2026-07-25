export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details: any[];
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR', details: any[] = []) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details: any[] = []) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND', []);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details: any[] = []) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class FinancialComputationError extends AppError {
  constructor(message: string = 'Financial calculation error', details: any[] = []) {
    super(message, 422, 'FINANCIAL_CALCULATION_ERROR', details);
  }
}
