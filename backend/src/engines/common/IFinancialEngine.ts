import { EngineContext } from './EngineContext';
import { EngineResult } from './EngineResult';

export interface EngineMetadata {
  id: string;
  name: string;
  version: string;
  supportedAssetTypes: string[];
  deterministic: boolean;
  idempotent: boolean;
}

export interface IFinancialEngine<TInput = unknown, TOutput = unknown> {
  readonly metadata: EngineMetadata;
  execute(context: EngineContext<TInput>): EngineResult<TOutput>;
}
