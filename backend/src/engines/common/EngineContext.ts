export interface UserContext {
  familyId?: number;
  memberId?: number;
}

export interface EngineContext<TData = unknown> {
  correlationId?: string;
  executionDate?: string;
  entityId?: number;
  accountId?: number;
  holdingId?: number;
  assetId?: number;
  userContext?: UserContext;
  featureFlags?: Record<string, boolean>;
  data: TData;
  options?: Record<string, any>;
}
