# Incident Response Protocol

## Severity Levels
- **P0 Critical**: Database corruption, unrecoverable transaction ledger error, or application crash loop.
- **P1 High**: Engine latency > 3 seconds, broker API sync failure, or tax loss harvesting mismatch.
- **P2 Medium**: Missing UI telemetry, minor styling regression, or slow background job.

## Triage Protocol
1. **Identify**: Check Observability Platform metrics at `/api/v1/platform/observability`.
2. **Contain**: Disable affected feature flag via `FeatureRegistry` if applicable.
3. **Resolve**: Apply bug fix or restore database snapshot.
4. **Post-Mortem**: Document incident root cause and record ADR if architectural change was required.
