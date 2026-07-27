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
  const { familyId } = req.query;
  if (!familyId || isNaN(Number(familyId))) {
    return next(new ValidationError('Query parameter "familyId" is required and must be a valid number'));
  }
  next();
}

export function validateReportGenerationBody(req: Request, res: Response, next: NextFunction): void {
  const { familyId, reportType, format } = req.body || {};
  if (!familyId || isNaN(Number(familyId))) {
    return next(new ValidationError('Body parameter "familyId" is required and must be a number'));
  }
  if (!reportType || !['PORTFOLIO_SUMMARY', 'TAX_STATEMENT', 'PERFORMANCE_REPORT'].includes(reportType)) {
    return next(new ValidationError('Body parameter "reportType" must be one of PORTFOLIO_SUMMARY, TAX_STATEMENT, PERFORMANCE_REPORT'));
  }
  if (!format || !['JSON', 'CSV', 'PDF'].includes(format)) {
    return next(new ValidationError('Body parameter "format" must be one of JSON, CSV, PDF'));
  }
  next();
}
