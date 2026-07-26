import { PriceSnapshot } from '../../engines/valuation/PriceSnapshot';

export type CacheCategory = 'QUOTE' | 'HISTORICAL' | 'FX';

export interface CachePolicy {
  ttlMs: number; // Time To Live in milliseconds
  maxEntries: number;
}

export const DEFAULT_CACHE_POLICIES: Record<CacheCategory, CachePolicy> = {
  QUOTE: { ttlMs: 5 * 60 * 1000, maxEntries: 1000 },      // 5 Minutes
  HISTORICAL: { ttlMs: 24 * 60 * 60 * 1000, maxEntries: 5000 }, // 24 Hours
  FX: { ttlMs: 12 * 60 * 60 * 1000, maxEntries: 500 }      // 12 Hours
};

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  category: CacheCategory;
}

export class ProviderCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private policies: Record<CacheCategory, CachePolicy>;

  constructor(customPolicies: Partial<Record<CacheCategory, CachePolicy>> = {}) {
    this.policies = { ...DEFAULT_CACHE_POLICIES, ...customPolicies };
  }

  public get<T = PriceSnapshot>(key: string, category: CacheCategory = 'QUOTE'): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const policy = this.policies[category] || this.policies.QUOTE;
    const now = Date.now();

    if (now - entry.timestamp > policy.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public set<T = PriceSnapshot>(key: string, value: T, category: CacheCategory = 'QUOTE'): void {
    const policy = this.policies[category] || this.policies.QUOTE;
    if (this.cache.size >= policy.maxEntries) {
      // Evict oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      category
    });
  }

  public invalidate(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

export const globalProviderCache = new ProviderCache();
