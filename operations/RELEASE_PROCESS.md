# Production Release Process

## Workflow Checklist
1. **Pre-Release Benchmark Validation**: Run `BenchmarkFramework` to verify zero latency regressions across calculation engines.
2. **Quality Gate Verification**: Check Production Readiness Dashboard score (Target: >= 95%).
3. **Automated Build & Test Suite**: Run `npm run build` and ensure test suite passes green.
4. **Documentation Index Audit**: Run `DocQualityValidator` to ensure no broken markdown links or missing ADR references.
5. **SemVer Tagging & Changelog**: Update `ROADMAP.md`, `product/RELEASE_NOTES.md`, `AI_CHANGELOG.md`, and `SESSION_CONTEXT.md`.
