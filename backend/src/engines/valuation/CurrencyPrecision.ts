import { FinancialMath } from '../common/FinancialMath';

export class CurrencyPrecision {
  public static roundMoney(amount: number, decimals = 2): number {
    return FinancialMath.roundMoney(amount, decimals);
  }

  public static roundUnits(units: number, decimals = 4): number {
    return FinancialMath.roundUnits(units, decimals);
  }

  public static roundPercent(percent: number, decimals = 2): number {
    if (isNaN(percent) || !isFinite(percent)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round((percent + Number.EPSILON) * factor) / factor;
  }

  public static formatCurrency(amount: number, currency = 'INR', locale = 'en-IN'): string {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    } catch {
      return `${currency} ${CurrencyPrecision.roundMoney(amount).toFixed(2)}`;
    }
  }
}
