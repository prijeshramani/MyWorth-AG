export class ProviderError extends Error {
  public readonly code: string;
  public readonly providerId: string;
  public readonly details?: any;

  constructor(code: string, providerId: string, message: string, details?: any) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.providerId = providerId;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkError extends ProviderError {
  constructor(providerId: string, message: string, details?: any) {
    super('NETWORK_ERROR', providerId, message, details);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends ProviderError {
  constructor(providerId: string, message: string, details?: any) {
    super('AUTHENTICATION_ERROR', providerId, message, details);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends ProviderError {
  constructor(providerId: string, message: string, details?: any) {
    super('RATE_LIMIT_ERROR', providerId, message, details);
    this.name = 'RateLimitError';
  }
}

export class ProviderUnavailableError extends ProviderError {
  constructor(providerId: string, message: string, details?: any) {
    super('PROVIDER_UNAVAILABLE_ERROR', providerId, message, details);
    this.name = 'ProviderUnavailableError';
  }
}

export class InvalidSymbolError extends ProviderError {
  constructor(providerId: string, message: string, details?: any) {
    super('INVALID_SYMBOL_ERROR', providerId, message, details);
    this.name = 'InvalidSymbolError';
  }
}

export class DataIntegrityError extends ProviderError {
  constructor(providerId: string, message: string, details?: any) {
    super('DATA_INTEGRITY_ERROR', providerId, message, details);
    this.name = 'DataIntegrityError';
  }
}
