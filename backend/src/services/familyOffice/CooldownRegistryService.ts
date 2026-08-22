import crypto from 'crypto';
import { SQLiteProactiveTriggerRepository, proactiveTriggerRepository, CooldownRegistryRow } from '../../repositories/SQLiteProactiveTriggerRepository';
import { ObserverRuleCode } from '../../contracts/familyOfficeContracts';

export interface MaterialityEvaluation {
  isMaterialChange: boolean;
  deltaValue: number;
  reason: string;
}

export interface CooldownEligibilityResult {
  isEligible: boolean;
  suppressionReason?: 'ACTIVE_COOLDOWN' | 'ACTIVE_SNOOZE' | 'USER_DISMISSED';
  cooldownUntil?: string;
  isMaterialityOverride: boolean;
  materialityDetails?: MaterialityEvaluation;
}

export class CooldownRegistryService {
  constructor(private repo: SQLiteProactiveTriggerRepository = proactiveTriggerRepository) {}

  /**
   * Deterministic Hash-Based Trigger ID
   * SHA256(familyId:ruleCode:entityId:stateHash:ruleVersion)
   */
  public generateTriggerId(
    familyId: number,
    ruleCode: string,
    entityId: string = 'FAMILY',
    stateHash: string,
    ruleVersion: string = '2026.1'
  ): string {
    const raw = `${familyId}:${ruleCode}:${entityId}:${stateHash}:${ruleVersion}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 24);
    return `trg_${hash}`;
  }

  /**
   * Checks if a rule is eligible to trigger for a family/entity
   */
  public checkEligibility(
    familyId: number,
    ruleCode: ObserverRuleCode,
    entityId: string = 'FAMILY',
    currentStateHash: string,
    currentMetricValue?: number
  ): CooldownEligibilityResult {
    const existing = this.repo.getCooldown(familyId, ruleCode, entityId);
    if (!existing) {
      return { isEligible: true, isMaterialityOverride: false };
    }

    const now = new Date();
    const cooldownExpiry = new Date(existing.cooldown_until);
    const snoozedExpiry = existing.snoozed_until ? new Date(existing.snoozed_until) : null;

    // Check Snooze
    if (snoozedExpiry && snoozedExpiry > now) {
      return {
        isEligible: false,
        suppressionReason: 'ACTIVE_SNOOZE',
        cooldownUntil: existing.snoozed_until!,
        isMaterialityOverride: false
      };
    }

    // If cooldown has expired, it is eligible
    if (cooldownExpiry <= now) {
      return { isEligible: true, isMaterialityOverride: false };
    }

    // Cooldown is active: Check rule-specific materiality override
    const materiality = this.evaluateMaterialShift(ruleCode, existing, currentStateHash, currentMetricValue);
    if (materiality.isMaterialChange) {
      return {
        isEligible: true,
        isMaterialityOverride: true,
        materialityDetails: materiality
      };
    }

    return {
      isEligible: false,
      suppressionReason: existing.status === 'DISMISSED' ? 'USER_DISMISSED' : 'ACTIVE_COOLDOWN',
      cooldownUntil: existing.cooldown_until,
      isMaterialityOverride: false,
      materialityDetails: materiality
    };
  }

  /**
   * Evaluates rule-specific materiality override when state shifts during active cooldown
   */
  public evaluateMaterialShift(
    ruleCode: ObserverRuleCode,
    existingCooldown: CooldownRegistryRow,
    currentStateHash: string,
    currentMetricValue?: number
  ): MaterialityEvaluation {
    if (currentStateHash === existingCooldown.last_state_hash) {
      return { isMaterialChange: false, deltaValue: 0, reason: 'Identical state hash' };
    }

    const lastVal = existingCooldown.last_metric_value ?? 0;
    const currVal = currentMetricValue ?? 0;
    const delta = Math.abs(currVal - lastVal);

    switch (ruleCode) {
      case 'DRIFT_EQUITY_OVERWEIGHT':
        // Material if equity allocation drift shifts by >= 2.5 percentage points
        if (delta >= 2.5) {
          return {
            isMaterialChange: true,
            deltaValue: delta,
            reason: `Equity allocation drift shifted by ${delta.toFixed(2)}% (threshold >= 2.5%)`
          };
        }
        break;

      case 'CONCENTRATION_SINGLE_STOCK':
        // Material if single stock concentration shifts by >= 3.0 percentage points
        if (delta >= 3.0) {
          return {
            isMaterialChange: true,
            deltaValue: delta,
            reason: `Single stock concentration shifted by ${delta.toFixed(2)}% (threshold >= 3.0%)`
          };
        }
        break;

      case 'INSURANCE_RENEWAL_DUE':
        // Material if policy moves into final critical 7-day urgency window when previous alert was > 7 days
        if (currVal <= 7 && lastVal > 7) {
          return {
            isMaterialChange: true,
            deltaValue: delta,
            reason: `Policy renewal entered critical 7-day window (${currVal} days remaining)`
          };
        }
        break;

      case 'PROTECTION_HLV_GAP':
        // Material if HLV protection gap changes by >= 15% (or emerges from 0)
        if ((lastVal > 0 && (delta / lastVal) >= 0.15) || (lastVal === 0 && currVal > 0)) {
          return {
            isMaterialChange: true,
            deltaValue: delta,
            reason: lastVal > 0 
              ? `HLV protection gap changed by ${((delta / lastVal) * 100).toFixed(1)}% (threshold >= 15%)`
              : `HLV protection gap emerged: ₹${currVal.toLocaleString('en-IN')}`
          };
        }
        break;

      case 'EMERGENCY_FUND_DEFICIT':
        // Material if liquid runway shifts by >= 15% (e.g. drop from 3.5 months to 2.8 months)
        if ((lastVal > 0 && (delta / lastVal) >= 0.15) || (lastVal === 0 && currVal > 0)) {
          return {
            isMaterialChange: true,
            deltaValue: delta,
            reason: lastVal > 0
              ? `Emergency runway shifted by ${((delta / lastVal) * 100).toFixed(1)}% (threshold >= 15%)`
              : `Emergency runway deficit emerged: ${currVal.toFixed(1)} months`
          };
        }
        break;

      case 'EXCESS_IDLE_CASH':
        // Material if idle cash reserve increases by >= 20%
        if ((lastVal > 0 && ((currVal - lastVal) / lastVal) >= 0.20) || (lastVal === 0 && currVal > 0)) {
          return {
            isMaterialChange: true,
            deltaValue: delta,
            reason: lastVal > 0
              ? `Idle cash reserves grew by ${(((currVal - lastVal) / lastVal) * 100).toFixed(1)}%`
              : `Excess idle cash reserves detected: ${currVal.toFixed(1)} months`
          };
        }
        break;

      case 'GOAL_OFF_TRACK_DRIFT':
        // Material if goal completion probability drops by >= 10 percentage points
        if (delta >= 10.0) {
          return {
            isMaterialChange: true,
            deltaValue: delta,
            reason: `Goal trajectory probability dropped by ${delta.toFixed(1)}%`
          };
        }
        break;

      case 'TAX_80C_OPPORTUNITY':
        // Material if tax deduction headroom changes by >= ₹25,000
        if (delta >= 25000) {
          return {
            isMaterialChange: true,
            deltaValue: delta,
            reason: `Section 80C headroom shifted by ₹${delta.toLocaleString('en-IN')}`
          };
        }
        break;

      case 'ESTATE_NOMINEE_GAP':
      case 'NOMINEE_REGISTRATION_GAP':
        // Material if new un-nominated asset count increases
        if (currVal > lastVal) {
          return {
            isMaterialChange: true,
            deltaValue: delta,
            reason: `New un-nominated asset detected (count: ${currVal})`
          };
        }
        break;
    }

    return {
      isMaterialChange: false,
      deltaValue: delta,
      reason: `Shift of ${delta.toFixed(2)} does not exceed rule materiality threshold`
    };
  }

  /**
   * Applies user dismissal cooldown multiplier (defaults to 2x cooldown window)
   */
  public recordDismissal(
    familyId: number,
    ruleCode: ObserverRuleCode,
    entityId: string = 'FAMILY',
    reason: string = 'User dismissed recommendation',
    baseCooldownDays: number = 14
  ): void {
    const extendedDays = baseCooldownDays * 2;
    const cooldownUntil = new Date(Date.now() + extendedDays * 24 * 60 * 60 * 1000).toISOString();
    const existing = this.repo.getCooldown(familyId, ruleCode, entityId);

    this.repo.upsertCooldown({
      familyId,
      ruleCode,
      entityId,
      lastTriggeredAt: new Date().toISOString(),
      cooldownUntil,
      lastStateHash: existing?.last_state_hash || 'DISMISSED_HASH',
      status: 'DISMISSED',
      dismissedAt: new Date().toISOString(),
      dismissReason: reason
    });
  }

  /**
   * Records user snooze (validated 1 to 30 days)
   */
  public recordSnooze(
    familyId: number,
    ruleCode: ObserverRuleCode,
    entityId: string = 'FAMILY',
    snoozeDays: number = 7
  ): void {
    const validatedDays = Math.max(1, Math.min(30, snoozeDays));
    const snoozedUntil = new Date(Date.now() + validatedDays * 24 * 60 * 60 * 1000).toISOString();
    const existing = this.repo.getCooldown(familyId, ruleCode, entityId);

    this.repo.upsertCooldown({
      familyId,
      ruleCode,
      entityId,
      lastTriggeredAt: existing?.last_triggered_at || new Date().toISOString(),
      cooldownUntil: snoozedUntil,
      lastStateHash: existing?.last_state_hash || 'SNOOZED_HASH',
      status: 'SNOOZED',
      snoozedUntil
    });
  }
}

export const cooldownRegistryService = new CooldownRegistryService();
