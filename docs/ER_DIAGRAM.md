# 📊 ER_DIAGRAM.md — Family Wealth OS Entity Relationship Diagram

**System Name**: Family Wealth OS  
**Author**: Lead Software Engineer & Software Architect  
**Date**: July 25, 2026  
**Status**: Architecture Diagram (Sprint 1C)

---

## Complete Entity Relationship Diagram (Mermaid ERD)

```mermaid
erDiagram
    families ||--|{ family_members : "has"
    family_members ||--|{ entities : "owns"
    entities ||--|{ accounts : "maintains"
    accounts ||--|{ holdings : "links"
    assets_master ||--|{ holdings : "held in"
    assets_master ||--|{ asset_prices : "tracks historical NAV/prices"
    assets_master ||--|{ transactions : "logs transactions"

    families {
        INTEGER id PK
        TEXT name
        TEXT currency
        TEXT created_at
        TEXT updated_at
        TEXT deleted_at
    }

    family_members {
        INTEGER id PK
        INTEGER family_id FK
        TEXT name
        TEXT relationship
        TEXT date_of_birth
        TEXT created_at
        TEXT updated_at
        TEXT deleted_at
    }

    entities {
        INTEGER id PK
        INTEGER family_member_id FK
        TEXT name
        TEXT entity_type
        TEXT pan_number
        TEXT created_at
        TEXT updated_at
        TEXT deleted_at
    }

    accounts {
        INTEGER id PK
        INTEGER entity_id FK
        TEXT account_name
        TEXT account_type
        TEXT provider
        TEXT institution_name
        TEXT account_number
        TEXT masked_account_number
        TEXT nickname
        INTEGER is_active
        TEXT created_at
        TEXT updated_at
        TEXT deleted_at
    }

    holdings {
        INTEGER id PK
        INTEGER account_id FK
        INTEGER asset_id FK
        TEXT opened_at
        TEXT closed_at
        TEXT status
        TEXT created_at
        TEXT updated_at
        TEXT deleted_at
    }

    assets_master {
        INTEGER id PK
        TEXT asset_type
        TEXT name
        TEXT display_name
        TEXT symbol
        TEXT isin
        TEXT currency
        TEXT status
        TEXT metadata
        TEXT created_at
        TEXT updated_at
        TEXT deleted_at
    }

    asset_prices {
        INTEGER asset_id PK_FK
        TEXT date PK
        REAL price
        TEXT created_at
    }

    transactions {
        INTEGER id PK
        INTEGER asset_id FK
        TEXT type
        TEXT date
        REAL quantity
        REAL price
        REAL amount
        TEXT source
        TEXT narration
        TEXT tx_category
        TEXT created_at
    }
```
