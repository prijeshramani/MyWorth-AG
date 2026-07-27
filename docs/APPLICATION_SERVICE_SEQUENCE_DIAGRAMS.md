# 🔄 APPLICATION_SERVICE_SEQUENCE_DIAGRAMS.md — Sequence Diagrams

**System Name**: Family Wealth OS  
**Phase**: Sprint 6A (Application Service Layer - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Sequence 1: End-to-End Family Portfolio Processing Flow

```mermaid
sequenceDiagram
    autonumber
    participant Client as API Controller / Client
    participant PAS as PortfolioApplicationService
    participant Repos as SQLite Repositories
    participant Reg as EngineRegistry
    participant SC as SnapshotCoordinator
    participant DTO as DTOMapper

    Client->>PAS: getConsolidatedPortfolio(RequestDTO)
    PAS->>Repos: fetchFamilyOwnershipGraph(familyId)
    Repos-->>PAS: Family, Member, Entity, Account, Holdings
    PAS->>Reg: executeEnginePipeline(Context)
    Reg-->>PAS: EngineSnapshots (NetWorth, Perf, Analytics, Risk)
    PAS->>SC: persistSnapshotLineage(Snapshots)
    SC-->>PAS: MasterSnapshotId
    PAS->>DTO: mapToPortfolioResponseDTO(Snapshots)
    DTO-->>PAS: PortfolioSummaryResponseDTO
    PAS-->>Client: PortfolioSummaryResponseDTO
```
