export class FinancialEngineError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'FinancialEngineError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class OversellError extends FinancialEngineError {
  constructor(message: string, details?: any) {
    super('OVERSELL_ERROR', message, details);
    this.name = 'OversellError';
  }
}

export class InvalidSequenceError extends FinancialEngineError {
  constructor(message: string, details?: any) {
    super('INVALID_SEQUENCE_ERROR', message, details);
    this.name = 'InvalidSequenceError';
  }
}

export class UnresolvedHoldingError extends FinancialEngineError {
  constructor(message: string, details?: any) {
    super('UNRESOLVED_HOLDING_ERROR', message, details);
    this.name = 'UnresolvedHoldingError';
  }
}
