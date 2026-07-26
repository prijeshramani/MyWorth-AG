import { IFinancialEngine } from './IFinancialEngine';

export class EngineRegistry {
  private static instance: EngineRegistry;
  private engines: Map<string, IFinancialEngine<any, any>> = new Map();

  private constructor() {}

  public static getInstance(): EngineRegistry {
    if (!EngineRegistry.instance) {
      EngineRegistry.instance = new EngineRegistry();
    }
    return EngineRegistry.instance;
  }

  public register(engine: IFinancialEngine<any, any>): void {
    this.engines.set(engine.metadata.id, engine);
  }

  public getEngine<TInput = unknown, TOutput = unknown>(id: string): IFinancialEngine<TInput, TOutput> | undefined {
    return this.engines.get(id) as IFinancialEngine<TInput, TOutput> | undefined;
  }

  public hasEngine(id: string): boolean {
    return this.engines.has(id);
  }

  public listEngines(): string[] {
    return Array.from(this.engines.keys());
  }

  public clear(): void {
    this.engines.clear();
  }
}

export const engineRegistry = EngineRegistry.getInstance();
