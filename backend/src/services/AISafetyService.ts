export interface SafetyEvaluationResult {
  isSafe: boolean;
  redactedQuery: string;
  disclaimer: string;
  violations: string[];
}

export class AISafetyService {
  public evaluateQuery(userQuery: string): SafetyEvaluationResult {
    const violations: string[] = [];
    let redactedQuery = userQuery;

    // Check PII patterns (PAN, Aadhaar, Account Numbers)
    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/g;
    if (panRegex.test(userQuery)) {
      redactedQuery = redactedQuery.replace(panRegex, '[REDACTED_PAN]');
      violations.push('PII_PAN_REDACTED');
    }

    const aadhaarRegex = /[0-9]{4}\s[0-9]{4}\s[0-9]{4}/g;
    if (aadhaarRegex.test(userQuery)) {
      redactedQuery = redactedQuery.replace(aadhaarRegex, '[REDACTED_AADHAAR]');
      violations.push('PII_AADHAAR_REDACTED');
    }

    const disclaimer = 'Disclaimer: AI Advisor suggestions are based on mathematical models and historical rules. Always consult a SEBI Registered Investment Advisor (RIA) before executing transactions.';

    return {
      isSafe: true,
      redactedQuery,
      disclaimer,
      violations
    };
  }
}
