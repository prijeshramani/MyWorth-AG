import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/AppError';

export function validatePortfolioSummaryQuery(req: Request, res: Response, next: NextFunction): void {
  const { familyId } = req.query;
  if (!familyId || isNaN(Number(familyId))) {
    return next(new ValidationError('Query parameter "familyId" is required and must be a valid number'));
  }
  next();
}

export function validateDashboardOverviewQuery(req: Request, res: Response, next: NextFunction): void {
  if (!req.query.familyId || isNaN(Number(req.query.familyId))) {
    req.query.familyId = '1';
  }
  next();
}

export function validateReportGenerationBody(req: Request, res: Response, next: NextFunction): void {
  const { familyId, reportType, format } = req.body || {};
  const famIdNum = Number(familyId || 1);
  if (isNaN(famIdNum)) {
    return next(new ValidationError('Body parameter "familyId" must be a valid number'));
  }
  if (!reportType || !['PORTFOLIO_SUMMARY', 'TAX_STATEMENT', 'PERFORMANCE_REPORT', 'HOLDINGS_LEDGER', 'PROTECTION_AUDIT', 'ESTATE_STATEMENT'].includes(reportType)) {
    return next(new ValidationError('Body parameter "reportType" must be one of PORTFOLIO_SUMMARY, TAX_STATEMENT, PERFORMANCE_REPORT, HOLDINGS_LEDGER, PROTECTION_AUDIT, ESTATE_STATEMENT'));
  }
  if (!format || !['JSON', 'CSV', 'PDF'].includes(format)) {
    return next(new ValidationError('Body parameter "format" must be one of JSON, CSV, PDF'));
  }
  next();
}
