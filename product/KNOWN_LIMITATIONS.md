# Product Management – Known Limitations

1. **Zero Raw Database Queries for AI**: AI Wealth Advisor is strictly restricted from executing direct SQL table queries or performing manual financial math. All data is provided via permission-aware Context & Evidence providers.
2. **Action Confirmation Requirement**: AI cannot execute trade orders or data mutations directly. Any recommended action must be reviewed and confirmed by the user.
3. **Local SQLite Single-User Storage**: Database is stored locally in SQLite (`data/myworth.db`). Multi-device real-time sync is planned for Phase 8.
