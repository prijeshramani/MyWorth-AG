/**
 * Financial precision math helper avoiding JavaScript floating point drift.
 */
export class FinancialMath {
  /**
   * Round monetary values to specified decimal places (default 2).
   */
  public static roundMoney(amount: number, decimals = 2): number {
    if (isNaN(amount) || !isFinite(amount)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round((amount + Number.EPSILON) * factor) / factor;
  }

  /**
   * Round quantity units to specified decimal places (default 4).
   */
  public static roundUnits(units: number, decimals = 4): number {
    if (isNaN(units) || !isFinite(units)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round((units + Number.EPSILON) * factor) / factor;
  }

  /**
   * Safe division avoiding DivisionByZero exceptions.
   */
  public static safeDiv(numerator: number, denominator: number, fallback = 0): number {
    if (!denominator || denominator === 0 || isNaN(denominator)) {
      return fallback;
    }
    return numerator / denominator;
  }
}
