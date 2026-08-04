export interface FeatureFlagDefinition {
  id: string;
  name: string;
  enabled: boolean;
  environment: 'development' | 'staging' | 'production' | 'all';
  versionIntroduced: string;
  rollbackSupport: boolean;
  dependencies: string[];
  description: string;
}

export interface FeatureFlagAuditRecord {
  id: number;
  featureId: string;
  previousValue: boolean;
  newValue: boolean;
  environment: string;
  user: string;
  reason?: string;
  timestamp: string;
}

export class FeatureRegistry {
  private features: Map<string, FeatureFlagDefinition> = new Map();
  private auditTrail: FeatureFlagAuditRecord[] = [];

  constructor() {
    this.registerDefaultFeatures();
  }

  private registerDefaultFeatures(): void {
    const defaults: FeatureFlagDefinition[] = [
      {
        id: 'AI_ADVISOR',
        name: 'AI Wealth Advisor Core',
        enabled: true,
        environment: 'all',
        versionIntroduced: 'v1.8.0',
        rollbackSupport: true,
        dependencies: ['AIContextAggregator', 'AISkillRegistry'],
        description: 'Multi-skill AI wealth conversation pipeline and evidence card generator.'
      },
      {
        id: 'MONTE_CARLO',
        name: 'Monte Carlo Projection Engine',
        enabled: true,
        environment: 'all',
        versionIntroduced: 'v1.7.0',
        rollbackSupport: fontRollback('v1.6.0'),
        dependencies: ['ProjectionEngine'],
        description: '1,000-iteration Monte Carlo retirement corpus projection.'
      },
      {
        id: 'VOICE_ASSISTANT',
        name: 'Voice Assistant Integration',
        enabled: false,
        environment: 'staging',
        versionIntroduced: 'v2.0.0-exp',
        rollbackSupport: true,
        dependencies: ['AIAdvisorService'],
        description: 'Speech-to-text financial query processing (Experimental).'
      },
      {
        id: 'CLOUD_SYNC',
        name: 'Encrypted Cloud Backup Sync',
        enabled: false,
        environment: 'staging',
        versionIntroduced: 'v2.0.0-exp',
        rollbackSupport: true,
        dependencies: ['BackupService'],
        description: 'Zero-knowledge end-to-end encrypted backup sync.'
      },
      {
        id: 'ADVISOR_PORTAL',
        name: 'Multi-Family Advisor Portal',
        enabled: false,
        environment: 'development',
        versionIntroduced: 'v2.0.0-exp',
        rollbackSupport: true,
        dependencies: ['FamilyRepository'],
        description: 'Multi-family wealth management portal for registered RIA advisors.'
      },
      {
        id: 'ITR_EFILING',
        name: 'Income Tax Department e-Filing JSON Builder',
        enabled: true,
        environment: 'all',
        versionIntroduced: 'v1.9.0',
        rollbackSupport: true,
        dependencies: ['CapitalGainsCalculator', 'ITRSchemaBuilder'],
        description: 'Generates official Sahaj ITR-1 / ITR-2 JSON payloads.'
      },
      {
        id: 'EXPERIMENTAL_FEATURES',
        name: 'Experimental AI Features Flag',
        enabled: false,
        environment: 'development',
        versionIntroduced: 'v1.9.0',
        rollbackSupport: true,
        dependencies: [],
        description: 'Toggles cutting-edge experimental AI features.'
      }
    ];

    for (const f of defaults) {
      this.features.set(f.id, f);
    }
  }

  public getFeature(id: string): FeatureFlagDefinition | undefined {
    return this.features.get(id);
  }

  public getAllFeatures(): FeatureFlagDefinition[] {
    return Array.from(this.features.values());
  }

  public isEnabled(id: string): boolean {
    const feat = this.features.get(id);
    return feat ? feat.enabled : false;
  }

  public setFeatureEnabled(id: string, enabled: boolean, user: string = 'system', reason?: string): boolean {
    const feat = this.features.get(id);
    if (!feat) return false;

    const previousValue = feat.enabled;
    feat.enabled = enabled;

    // Log to audit trail
    this.auditTrail.unshift({
      id: this.auditTrail.length + 1,
      featureId: id,
      previousValue,
      newValue: enabled,
      environment: feat.environment,
      user,
      reason: reason || `Toggled feature ${id} to ${enabled}`,
      timestamp: new Date().toISOString()
    });

    return true;
  }

  public getAuditTrail(): FeatureFlagAuditRecord[] {
    return this.auditTrail;
  }
}

function fontRollback(ver: string): boolean {
  return true;
}

export const featureRegistry = new FeatureRegistry();
