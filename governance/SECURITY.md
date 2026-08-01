# Security & Hardening Policy

## 1. Local-First Storage & Encryption
- All financial data, credentials, and tokens are stored locally inside `data/myworth.db`.
- Database encryption at rest is supported via AES-256 local database wrappers.
- No personal financial records or PAN numbers are ever transmitted to third-party cloud services without explicit user consent.

## 2. API Key & Auth Token Protection
- Broker API tokens (Zerodha Kite, AngelOne, Upstox, INDMoney 2FA TOTP) are loaded strictly from environment variables or local encrypted configuration files.
- Credentials are zeroed out from memory after request completion.

## 3. Execution Confirmation Gates
- High-risk AI actions (`APPLY_REBALANCING_PLAN`, `GENERATE_ITR_JSON`) require explicit preview verification and user confirmation before execution.
