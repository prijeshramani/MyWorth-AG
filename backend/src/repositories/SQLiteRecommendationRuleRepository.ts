import Database from 'better-sqlite3';

export interface RecommendationRuleRecord {
  id: number;
  rule_code: string;
  category: 'INVESTMENT' | 'TAX' | 'ESTATE' | 'PROTECTION' | 'PLANNING';
  title_template: string;
  description_template: string;
  threshold_config_json?: string;
  priority_default: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  journey_id?: string;
  prerequisite_rule_code?: string;
  is_active: number;
  version: number;
  created_at: string;
}

export class SQLiteRecommendationRuleRepository {
  constructor(private db: Database.Database) {}

  public seedBaselineRules(): void {
    const rules = [
      {
        rule_code: 'TAX_80C_OPTIMIZATION',
        category: 'TAX',
        title_template: 'Optimize Section 80C Tax Deductions (Save ₹{taxSaving})',
        description_template: 'Unutilized Section 80C headroom of ₹{unutilizedAmount}. Investing in ELSS or PPF reduces annual tax burden by ₹{taxSaving}.',
        priority_default: 'HIGH',
        journey_id: 'TAX_OPTIMISATION'
      },
      {
        rule_code: 'PROTECTION_TERM_UNDERINSURED',
        category: 'PROTECTION',
        title_template: 'Critical Term Life Insurance Protection Gap',
        description_template: 'Current term coverage of ₹{currentCover} is below Human Life Value requirement of ₹{requiredCover}. Additional ₹{gap} cover recommended.',
        priority_default: 'CRITICAL',
        journey_id: 'WEALTH_PROTECTION'
      },
      {
        rule_code: 'ESTATE_WILL_MISSING',
        category: 'ESTATE',
        title_template: 'Missing Registered Will & Succession Plan',
        description_template: 'Primary testator has no registered Will on record. Drafting a Will secures asset transmission for ₹{estateValue} net estate.',
        priority_default: 'HIGH',
        journey_id: 'ESTATE_READINESS'
      },
      {
        rule_code: 'PLANNING_RETIREMENT_STEPUP',
        category: 'PLANNING',
        title_template: 'Step Up Monthly Retirement SIP by {stepUpPct}%',
        description_template: 'Current retirement SIP of ₹{currentSip}/mo leaves a corpus gap of ₹{corpusGap} by age {retirementAge}. Stepping up SIP by {stepUpPct}% closes the gap.',
        priority_default: 'HIGH',
        journey_id: 'RETIREMENT_READINESS',
        prerequisite_rule_code: 'PLANNING_EMERGENCY_FUND_GAP'
      },
      {
        rule_code: 'PLANNING_EMERGENCY_FUND_GAP',
        category: 'PLANNING',
        title_template: 'Emergency Fund Shortfall in Liquid Reserves',
        description_template: 'Liquid emergency reserves of ₹{currentReserve} are below 6 months expense benchmark of ₹{requiredReserve}. Allocate ₹{shortfall} to liquid funds.',
        priority_default: 'CRITICAL',
        journey_id: 'WEALTH_PROTECTION'
      },
      {
        rule_code: 'INVESTMENT_IDLE_CASH',
        category: 'INVESTMENT',
        title_template: 'Deploy Idle Cash Reserve into Yield Assets',
        description_template: 'Excess bank balance of ₹{idleAmount} earning low interest. Deploying into Arbitrage or Debt funds generates estimated ₹{expectedYield} additional yield.',
        priority_default: 'MEDIUM',
        journey_id: 'FINANCIAL_INDEPENDENCE_FIRE'
      }
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO recommendation_rules (rule_code, category, title_template, description_template, priority_default, journey_id, prerequisite_rule_code, is_active, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
    `);

    for (const r of rules) {
      stmt.run(r.rule_code, r.category, r.title_template, r.description_template, r.priority_default, r.journey_id, r.prerequisite_rule_code || null);
    }
  }

  public getActiveRules(): RecommendationRuleRecord[] {
    this.seedBaselineRules();
    return this.db.prepare('SELECT * FROM recommendation_rules WHERE is_active = 1').all() as RecommendationRuleRecord[];
  }
}
