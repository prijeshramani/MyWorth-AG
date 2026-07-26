export interface EngineWarning {
  code: string;
  message: string;
  details?: any;
}

export interface EngineError {
  code: string;
  message: string;
  details?: any;
}

export interface EngineMetrics {
  processedCount: number;
  warningCount: number;
  errorCount: number;
}

export interface EngineResult<T = unknown> {
  success: boolean;
  data?: T;
  warnings: EngineWarning[];
  errors: EngineError[];
  auditTrail: string[];
  metrics: EngineMetrics;
  executionTimeMs: number;
  engineVersion: string;
}
