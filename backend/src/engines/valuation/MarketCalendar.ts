export interface IMarketCalendar {
  isTradingDay(date: string, exchange?: string): boolean;
  getLatestTradingDay(asOfDate: string, exchange?: string): string;
  isStalePrice(priceDate: string, valuationDate: string, maxDays?: number): boolean;
}

export class MarketCalendar implements IMarketCalendar {
  private static instance: MarketCalendar;

  private constructor() {}

  public static getInstance(): MarketCalendar {
    if (!MarketCalendar.instance) {
      MarketCalendar.instance = new MarketCalendar();
    }
    return MarketCalendar.instance;
  }

  public isTradingDay(dateStr: string, _exchange = 'DEFAULT'): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    return true; // Simplified trading day check (weekends excluded)
  }

  public getLatestTradingDay(asOfDateStr: string, exchange = 'DEFAULT'): string {
    let date = new Date(asOfDateStr);
    if (isNaN(date.getTime())) {
      date = new Date();
    }

    let dateStr = date.toISOString().split('T')[0];
    while (!this.isTradingDay(dateStr, exchange)) {
      date.setUTCDate(date.getUTCDate() - 1);
      dateStr = date.toISOString().split('T')[0];
    }
    return dateStr;
  }

  public isStalePrice(priceDateStr: string, valuationDateStr: string, maxDays = 5): boolean {
    if (!priceDateStr || !valuationDateStr) return true;
    const pDate = new Date(priceDateStr);
    const vDate = new Date(valuationDateStr);
    if (isNaN(pDate.getTime()) || isNaN(vDate.getTime())) return true;

    const diffTime = Math.abs(vDate.getTime() - pDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > maxDays;
  }
}

export const marketCalendar = MarketCalendar.getInstance();
