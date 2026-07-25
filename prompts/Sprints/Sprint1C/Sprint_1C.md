Sprint 1C – Asset Master & Holdings Foundation
Objective: Introduce the Asset Master and Holding model without introducing a Portfolio abstraction.
Approved Architecture
Family
 └─ Family Member
     └─ Entity
         └─ Account
             └─ Holding
                 └─ Asset (Master)
                     ├─ Transactions
                     └─ Price History
Core Design Principles
• Asset is the master definition of anything that contributes to net worth (Stock, Mutual Fund, ETF, FD, PPF, EPF, NPS, SSA, Bank, Gold, Real Estate, Crypto, etc.).
• Holding represents ownership of an Asset within an Account.
• Transactions are the source of truth.
• Current Value, Quantity, Average Cost, Unrealized Gain and similar values should be computed from Transactions and latest prices wherever practical, not duplicated as authoritative data.
• Asset records must never be duplicated across accounts. Multiple accounts may reference the same Asset.
Asset Master
Create a generic Asset master table.
• id
• asset_type
• name
• display_name
• symbol (nullable)
• isin (nullable)
• currency
• status
• metadata (JSON optional)
• created_at
• updated_at
• deleted_at
Supported Asset Types
STOCK, MUTUAL_FUND, ETF, BOND, FD, PPF, EPF, NPS, SSA, BANK, GOLD, REAL_ESTATE, CRYPTO, OTHER
Holding
Holding is the ownership link between Account and Asset.
• id
• account_id
• asset_id
• opened_at
• closed_at (nullable)
• status
• created_at
• updated_at
• deleted_at
Do not persist calculated values in Holding unless explicitly implemented as cache/projection. Transactions remain the source of truth.
Implementation Scope
• Versioned migration only (new migration).
• Repositories: AssetMasterRepository and HoldingRepository.
• Services: AssetService and HoldingService.
• REST CRUD for Assets and Holdings.
• Validation for nullable asset-specific fields.
• Soft delete support.
• Backward compatible with Sprint 1A and Sprint 1B.
Out of Scope
• Portfolio tables or APIs
• XIRR engine
• Tax engine
• Net Worth engine
• Analytics
• Goal planning
• UI redesign
Deliverables
• Update AI_CHANGELOG.md
• Update SESSION_CONTEXT.md
• Sprint 1C Implementation Summary.md
• Sprint 1C Retrospective.md
• All existing tests must continue to pass and new tests added.
