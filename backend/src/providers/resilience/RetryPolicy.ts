export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 200,
  maxDelayMs: 2000,
  backoffFactor: 2
};

export class RetryPolicy {
  public static async execute<T>(
    fn: (attempt: number) => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: any;

    for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
      try {
        return await fn(attempt);
      } catch (err: any) {
        lastError = err;
        if (attempt > opts.maxRetries) break;

        const baseDelay = opts.initialDelayMs * Math.pow(opts.backoffFactor, attempt - 1);
        const jitter = Math.random() * 50;
        const delay = Math.min(opts.maxDelayMs, baseDelay + jitter);

        await new Promise(res => setTimeout(res, delay));
      }
    }
    throw lastError;
  }
}
