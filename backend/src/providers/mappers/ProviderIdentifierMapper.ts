export interface ProviderQueryRequest {
  providerId: string; // 'YAHOO_FINANCE', 'AMFI', 'NPS', 'MANUAL'
  assetId?: number;
  symbol?: string;
  exchange?: string;
  isin?: string;
  metadata?: Record<string, any>;
}

export class ProviderIdentifierMapper {
  private static instance: ProviderIdentifierMapper;

  private constructor() {}

  public static getInstance(): ProviderIdentifierMapper {
    if (!ProviderIdentifierMapper.instance) {
      ProviderIdentifierMapper.instance = new ProviderIdentifierMapper();
    }
    return ProviderIdentifierMapper.instance;
  }

  public resolveProviderQuerySymbol(request: ProviderQueryRequest): string {
    const { providerId, symbol = '', exchange = '', metadata } = request;
    const providerUpper = providerId.toUpperCase();
    const exchangeUpper = exchange.toUpperCase();

    // Custom metadata override if present
    if (metadata?.providerSymbols?.[providerUpper]) {
      return metadata.providerSymbols[providerUpper];
    }

    if (providerUpper === 'YAHOO_FINANCE') {
      if (metadata?.yahooSymbol) return metadata.yahooSymbol;

      // Indian exchange suffixing rule
      if (exchangeUpper === 'NSE') {
        return symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
      }
      if (exchangeUpper === 'BSE') {
        return symbol.endsWith('.BO') ? symbol : `${symbol}.BO`;
      }
      // US exchange (NASDAQ / NYSE) requires no suffix
      return symbol.toUpperCase();
    }

    if (providerUpper === 'AMFI') {
      return metadata?.amfiCode || symbol;
    }

    if (providerUpper === 'NPS') {
      return metadata?.npsScheme || symbol;
    }

    return symbol;
  }
}

export const providerIdentifierMapper = ProviderIdentifierMapper.getInstance();
