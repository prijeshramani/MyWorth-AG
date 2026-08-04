# FamilyWealthOS – Architecture Principles

## Principles
1. **Layer Separation**: Clear separation between UI Presentation, AI Context Aggregation, Business Rules Engine, and Database Repositories.
2. **Registry-Driven Discoverability**: Registries (`SkillRegistry`, `ActionRegistry`, `PluginRegistry`, `FeatureRegistry`, `PlatformRegistry`) serve as single discoverable sources of truth without duplication.
3. **Dependency Graph Integrity**: Explicit mapping of `Feature -> Skill -> Action -> Engine`.
4. **Observable Runtime**: Every engine, background job, and registry exposes latency, cache hit ratios, and health indicators.
5. **Fail-Safe Rollbacks**: High-risk operations mandate user confirmation, backups, and defined rollback procedures.
