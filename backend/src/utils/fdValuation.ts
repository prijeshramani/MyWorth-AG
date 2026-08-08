/**
 * Fixed Deposit Valuation Utility
 * Accrues compounding/simple interest over time based on interest rate, start date, maturity amount, and compounding frequency.
 */

export interface FixedDepositValuationInput {
  costBasis: number; // Principal investment amount (e.g. 33000)
  interestRate?: number; // Annual interest rate percentage (e.g. 7.25)
  maturityAmount?: number; // Target maturity amount (e.g. 40000)
  startDateStr: string; // Investment start date (e.g. '2025-01-15')
  maturityDateStr?: string; // Maturity date (e.g. '2027-01-15')
  asOfDateStr?: string; // Valuation date (defaults to today's YYYY-MM-DD)
  compoundingFrequency?: string; // 'QUARTERLY' (default), 'MONTHLY', 'HALF_YEARLY', 'ANNUAL', 'SIMPLE'
}

export interface FixedDepositValuationResult {
  marketValue: number;
  accruedInterest: number;
  unrealizedGainPercent: number;
}

export function calculateFixedDepositValuation(input: FixedDepositValuationInput): FixedDepositValuationResult {
  const {
    costBasis,
    interestRate = 0,
    maturityAmount = 0,
    startDateStr,
    maturityDateStr,
    asOfDateStr,
    compoundingFrequency = 'QUARTERLY'
  } = input;

  if (costBasis <= 0) {
    return { marketValue: 0, accruedInterest: 0, unrealizedGainPercent: 0 };
  }

  const sDate = startDateStr ? new Date(startDateStr) : new Date();
  const eDate = asOfDateStr ? new Date(asOfDateStr) : new Date();

  if (isNaN(sDate.getTime()) || isNaN(eDate.getTime()) || eDate <= sDate) {
    return {
      marketValue: costBasis,
      accruedInterest: 0,
      unrealizedGainPercent: 0
    };
  }

  let marketValue = costBasis;

  // Case A: If Maturity Amount and Maturity Date are specified
  if (maturityAmount > costBasis && maturityDateStr) {
    const mDate = new Date(maturityDateStr);
    if (!isNaN(mDate.getTime()) && mDate > sDate) {
      const totalDurationMs = mDate.getTime() - sDate.getTime();
      const elapsedMs = Math.min(totalDurationMs, eDate.getTime() - sDate.getTime());
      const progress = Math.max(0, elapsedMs / totalDurationMs);

      // Exponential compounding accrual curve matching (1 + r)^t from P to M
      marketValue = costBasis * Math.pow(maturityAmount / costBasis, progress);
      marketValue = Math.round(marketValue * 100) / 100;
      const accruedInterest = Math.round((marketValue - costBasis) * 100) / 100;
      const unrealizedGainPercent = costBasis > 0 ? Math.round(((marketValue - costBasis) / costBasis) * 10000) / 100 : 0;
      return { marketValue, accruedInterest, unrealizedGainPercent };
    }
  }

  // Case B: If Interest Rate is specified
  if (interestRate > 0) {
    const elapsedMs = eDate.getTime() - sDate.getTime();
    const elapsedYears = elapsedMs / (1000 * 60 * 60 * 24 * 365.25);

    const freq = (compoundingFrequency || 'QUARTERLY').toUpperCase();
    if (freq === 'SIMPLE') {
      marketValue = costBasis * (1 + (interestRate / 100) * elapsedYears);
    } else {
      let n = 4; // QUARTERLY default in Indian Banking FDs
      if (freq === 'MONTHLY') n = 12;
      else if (freq === 'HALF_YEARLY') n = 2;
      else if (freq === 'ANNUAL' || freq === 'YEARLY') n = 1;

      const r = interestRate / 100;
      marketValue = costBasis * Math.pow(1 + r / n, n * elapsedYears);
    }

    marketValue = Math.round(marketValue * 100) / 100;
    const accruedInterest = Math.round((marketValue - costBasis) * 100) / 100;
    const unrealizedGainPercent = costBasis > 0 ? Math.round(((marketValue - costBasis) / costBasis) * 10000) / 100 : 0;
    return { marketValue, accruedInterest, unrealizedGainPercent };
  }

  return {
    marketValue: costBasis,
    accruedInterest: 0,
    unrealizedGainPercent: 0
  };
}

export function extractFdMetadata(asset: any, firstTxDate?: string): {
  interestRate: number;
  maturityAmount: number;
  startDate: string;
  maturityDate: string;
  compoundingFrequency: string;
} {
  let interestRate = asset.interest_rate || 0;
  let maturityAmount = asset.maturity_amount || 0;
  let startDate = asset.start_date || firstTxDate || asset.created_at || '';
  let maturityDate = asset.maturity_date || '';
  let compoundingFrequency = asset.compounding_frequency || 'QUARTERLY';

  if (asset.metadata) {
    try {
      const meta = typeof asset.metadata === 'string' ? JSON.parse(asset.metadata) : asset.metadata;
      if (meta.interestRate) interestRate = Number(meta.interestRate);
      if (meta.maturityAmount) maturityAmount = Number(meta.maturityAmount);
      if (meta.startDate) startDate = meta.startDate;
      if (meta.maturityDate) maturityDate = meta.maturityDate;
      if (meta.compoundingFrequency) compoundingFrequency = meta.compoundingFrequency;
    } catch (e) {
      // Ignore JSON parse error
    }
  }

  // Regex fallback parsing from identifier/isin/name
  const str = `${asset.identifier || ''} ${asset.isin || ''} ${asset.name || ''}`;
  if (!interestRate) {
    const rateMatch = str.match(/(\d+(?:\.\d+)?)%/);
    if (rateMatch) interestRate = parseFloat(rateMatch[1]);
  }
  if (!maturityDate) {
    const yearMatch = str.match(/20\d{2}/);
    if (yearMatch) {
      const year = yearMatch[0];
      const monthDay = startDate ? startDate.slice(5, 10) : '01-15';
      maturityDate = `${year}-${monthDay}`;
    }
  }

  return { interestRate, maturityAmount, startDate, maturityDate, compoundingFrequency };
}
