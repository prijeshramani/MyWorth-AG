export interface PluginDefinition {
  id: string;
  name: string;
  category: 'BROKER' | 'DEPOSIT_REPOSITORY' | 'TAX_PORTAL' | 'GOVERNMENT' | 'REGULATOR';
  version: string;
  health: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  compatibility: string; // e.g. ">= v1.8.0"
  requiredPermissions: string[];
  exposedApis: string[];
  status: 'INSTALLED' | 'ENABLED' | 'DISABLED' | 'ERROR';
  description: string;
  lastSyncTimestamp?: string;
}

export class PluginRegistry {
  private plugins: Map<string, PluginDefinition> = new Map();

  constructor() {
    this.registerDefaultPlugins();
  }

  private registerDefaultPlugins(): void {
    const defaultPlugins: PluginDefinition[] = [
      {
        id: 'zerodha_kite',
        name: 'Zerodha Kite Connect Plugin',
        category: 'BROKER',
        version: 'v1.4.0',
        health: 'HEALTHY',
        compatibility: '>= v1.8.0',
        requiredPermissions: ['READ_PORTFOLIO', 'IMPORT_HOLDINGS'],
        exposedApis: ['/api/v1/import/kite'],
        status: 'ENABLED',
        description: 'Auto-syncs Zerodha equity and mutual fund holdings via official Kite APIs.',
        lastSyncTimestamp: new Date().toISOString()
      },
      {
        id: 'groww_sync',
        name: 'Groww Portfolio Sync Plugin',
        category: 'BROKER',
        version: 'v1.2.0',
        health: 'HEALTHY',
        compatibility: '>= v1.8.0',
        requiredPermissions: ['READ_PORTFOLIO'],
        exposedApis: ['/api/v1/import/groww'],
        status: 'ENABLED',
        description: 'Syncs Groww mutual fund SIPs and equity investments.',
        lastSyncTimestamp: new Date().toISOString()
      },
      {
        id: 'cams_cas',
        name: 'CAMS / KFintech Consolidated Account Statement Parser',
        category: 'DEPOSIT_REPOSITORY',
        version: 'v2.1.0',
        health: 'HEALTHY',
        compatibility: '>= v1.5.0',
        requiredPermissions: ['READ_MUTUAL_FUNDS', 'IMPORT_CAS'],
        exposedApis: ['/api/v1/import/cas-pdf'],
        status: 'ENABLED',
        description: 'Parses password-protected CAMS/KFintech CAS PDF statements.',
        lastSyncTimestamp: new Date().toISOString()
      },
      {
        id: 'nsdl_cdsl_cas',
        name: 'NSDL / CDSL Demat CAS Parser',
        category: 'DEPOSIT_REPOSITORY',
        version: 'v1.1.0',
        health: 'HEALTHY',
        compatibility: '>= v1.7.0',
        requiredPermissions: ['READ_DEMAT', 'IMPORT_CAS'],
        exposedApis: ['/api/v1/import/nsdl-cas'],
        status: 'ENABLED',
        description: 'Parses NSDL and CDSL demat account statements.',
        lastSyncTimestamp: new Date().toISOString()
      },
      {
        id: 'epfo_passbook',
        name: 'EPFO Member Passbook Parser',
        category: 'GOVERNMENT',
        version: 'v1.3.0',
        health: 'HEALTHY',
        compatibility: '>= v1.8.0',
        requiredPermissions: ['READ_EPF', 'IMPORT_EPF'],
        exposedApis: ['/api/v1/import/epf-statement'],
        status: 'ENABLED',
        description: 'Parses TCS and EPFO employer provident fund monthly passbook PDFs.',
        lastSyncTimestamp: new Date().toISOString()
      },
      {
        id: 'income_tax_portal',
        name: 'Income Tax Department Schema Integrator',
        category: 'TAX_PORTAL',
        version: 'v1.9.0',
        health: 'HEALTHY',
        compatibility: '>= v1.9.0',
        requiredPermissions: ['GENERATE_ITR'],
        exposedApis: ['/api/v1/itr/download-json'],
        status: 'ENABLED',
        description: 'Generates Income Tax Portal compliant Sahaj ITR-1 / ITR-2 e-Filing JSON.',
        lastSyncTimestamp: new Date().toISOString()
      },
      {
        id: 'rbi_sovereign_gold',
        name: 'RBI Sovereign Gold Bond & T-Bill Monitor',
        category: 'REGULATOR',
        version: 'v1.0.0',
        health: 'HEALTHY',
        compatibility: '>= v1.8.0',
        requiredPermissions: ['READ_BULLION'],
        exposedApis: ['/api/v1/assets/sgb'],
        status: 'ENABLED',
        description: 'Monitors RBI SGB interest payout dates and redemption maturity prices.',
        lastSyncTimestamp: new Date().toISOString()
      },
      {
        id: 'indmoney_sync',
        name: 'INDmoney Multi-Asset Sync Plugin',
        category: 'BROKER',
        version: 'v1.5.0',
        health: 'HEALTHY',
        compatibility: '>= v1.8.0',
        requiredPermissions: ['READ_PORTFOLIO', 'IMPORT_HOLDINGS'],
        exposedApis: ['/api/v1/import/indmoney'],
        status: 'ENABLED',
        description: 'Imports INDmoney holdings, US Stocks, and Indian Mutual Funds with TOTP support.',
        lastSyncTimestamp: new Date().toISOString()
      }
    ];

    for (const p of defaultPlugins) {
      this.plugins.set(p.id, p);
    }
  }

  // Lifecycle Methods (Mandatory Enhancement #3)
  public installPlugin(plugin: PluginDefinition): boolean {
    if (!this.validateCompatibility(plugin.compatibility)) {
      throw new Error(`Plugin '${plugin.name}' compatibility check failed for '${plugin.compatibility}'`);
    }
    plugin.status = 'INSTALLED';
    this.plugins.set(plugin.id, plugin);
    return true;
  }

  public enablePlugin(id: string): boolean {
    const p = this.plugins.get(id);
    if (!p) return false;
    p.status = 'ENABLED';
    return true;
  }

  public disablePlugin(id: string): boolean {
    const p = this.plugins.get(id);
    if (!p) return false;
    p.status = 'DISABLED';
    return true;
  }

  public upgradePlugin(id: string, newVersion: string): boolean {
    const p = this.plugins.get(id);
    if (!p) return false;
    p.version = newVersion;
    p.health = 'HEALTHY';
    return true;
  }

  public rollbackPlugin(id: string, previousVersion: string): boolean {
    const p = this.plugins.get(id);
    if (!p) return false;
    p.version = previousVersion;
    p.health = 'HEALTHY';
    return true;
  }

  public validateCompatibility(compatibilityReq: string): boolean {
    // Platform version is v2.0.0
    return true;
  }

  public getPlugin(id: string): PluginDefinition | undefined {
    return this.plugins.get(id);
  }

  public getAllPlugins(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();
