# Plugin Framework & Lifecycle Specification

## Overview
The `PluginRegistry` manages integrations for brokers, deposit repositories, tax portals, and regulatory bodies.

---

## Active Plugins & Status

| Plugin ID | Plugin Name | Category | Version | Status | Health |
|---|---|---|---|---|---|
| `zerodha_kite` | Zerodha Kite Connect Plugin | BROKER | v1.4.0 | ENABLED | HEALTHY |
| `groww_sync` | Groww Portfolio Sync Plugin | BROKER | v1.2.0 | ENABLED | HEALTHY |
| `cams_cas` | CAMS / KFintech CAS Parser | DEPOSIT_REPOSITORY | v2.1.0 | ENABLED | HEALTHY |
| `nsdl_cdsl_cas` | NSDL / CDSL Demat CAS Parser | DEPOSIT_REPOSITORY | v1.1.0 | ENABLED | HEALTHY |
| `epfo_passbook` | EPFO Member Passbook Parser | GOVERNMENT | v1.3.0 | ENABLED | HEALTHY |
| `income_tax_portal` | Income Tax Department Schema | TAX_PORTAL | v1.9.0 | ENABLED | HEALTHY |
| `rbi_sovereign_gold` | RBI Sovereign Gold Bond Monitor | REGULATOR | v1.0.0 | ENABLED | HEALTHY |
| `indmoney_sync` | INDmoney Multi-Asset Sync | BROKER | v1.5.0 | ENABLED | HEALTHY |

---

## Plugin Lifecycle API
Supports standard lifecycle operations: `install`, `enable`, `disable`, `upgrade`, `rollback`, and `validateCompatibility`.
