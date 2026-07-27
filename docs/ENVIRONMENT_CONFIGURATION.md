# ⚙️ ENVIRONMENT_CONFIGURATION.md — Environment Configuration Guide

**System Name**: Family Wealth OS  
**Phase**: Sprint 6D  
**Date**: July 27, 2026  
**Status**: APPROVED ENVIRONMENT GUIDE  

---

## 1. Environment Variables Specification

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | HTTP Server Port |
| `NODE_ENV` | Optional | `development` | Runtime environment (`development`, `production`, `test`) |
| `DB_PATH` | Optional | `./myworth.db` | SQLite Database file path |
| `ENCRYPTION_KEY` | Required (Prod) | Auto-generated dev key | 32-byte hexadecimal key for AES-256-GCM credential encryption |
| `LOG_LEVEL` | Optional | `info` | API logger verbosity |
