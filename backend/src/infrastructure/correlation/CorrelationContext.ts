import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';

export interface CorrelationStore {
  correlationId: string;
  causationId?: string;
  familyId?: number;
  userId?: number;
  timestamp: string;
}

const asyncLocalStorage = new AsyncLocalStorage<CorrelationStore>();

export class CorrelationContext {
  public static runWithContext<R>(store: CorrelationStore, fn: () => R): R {
    return asyncLocalStorage.run(store, fn);
  }

  public static getStore(): CorrelationStore | undefined {
    return asyncLocalStorage.getStore();
  }

  public static getCorrelationId(): string {
    const store = asyncLocalStorage.getStore();
    return store?.correlationId || `req_${crypto.randomUUID()}`;
  }

  public static getCausationId(): string | undefined {
    return asyncLocalStorage.getStore()?.causationId;
  }

  public static getFamilyId(): number | undefined {
    return asyncLocalStorage.getStore()?.familyId;
  }

  public static getUserId(): number | undefined {
    return asyncLocalStorage.getStore()?.userId;
  }

  public static generateId(prefix: string = 'evt'): string {
    return `${prefix}_${crypto.randomUUID()}`;
  }
}
