# Operational Release Checklist

## Pre-Release Sign-Off Criteria

- [ ] **Build Validation**: Executed `npm run build` cleanly across root, backend, and frontend. Zero TypeScript errors.
- [ ] **Automated Test Suite**: Verified 235+ test suite runs green with 0 failures.
- [ ] **Performance Benchmarks**: Executed `BenchmarkFramework` suite for Portfolio Engine, Tax Engine, Projection Engine, Recommendation Engine, Knowledge Graph, AI Context, and Simulation Engine. Verified zero performance regressions.
- [ ] **Platform Health Check**: Executed `PlatformHealthAggregator` and verified all 11 component health statuses report `HEALTHY`.
- [ ] **Production Readiness Score**: Verified Production Readiness Score is >= 95% on `/api/v1/platform/production-readiness`.
- [ ] **Feature Flag Audit**: Verified default production states in `FeatureRegistry`.
- [ ] **Plugin Lifecycle Audit**: Verified status and compatibility ratings for all plugins in `PluginRegistry`.
- [ ] **Documentation Quality Gate**: Executed `DocQualityValidator` to ensure 0 broken links and complete ADR coverage.
- [ ] **Security Scanning**: Executed `SecurityHardeningService` for secret scanning and dependency check.
- [ ] **Release Governance Update**: Updated `ROADMAP.md`, `CAPABILITIES.md`, `product/RELEASE_NOTES.md`, `AI_CHANGELOG.md`, and `SESSION_CONTEXT.md`.
