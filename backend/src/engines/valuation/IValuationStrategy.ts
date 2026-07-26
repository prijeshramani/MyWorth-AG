import { ValuationContext } from './ValuationContext';
import { ValuationResult } from './ValuationResult';

export interface IValuationStrategy {
  readonly assetType: string;
  readonly name: string;
  readonly valuationMethod: string;
  value(context: ValuationContext): ValuationResult;
}
