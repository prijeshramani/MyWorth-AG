# ADR 008 – Ephemeral What-If Simulation Engine

## Context
Users require interactive financial scenario modeling (e.g. *"What if I increase my monthly SIP by 15%?"* or *"What if I retire 3 years early?"*) without corrupting live portfolio ledgers.

## Decision
We implement `WhatIfSimulationEngine`, a zero-mutation simulation engine that takes base portfolio context, applies transient scenario adjustments (SIP adjustments, lump-sum investments, retirement target age, goal target date, inflation rate), and computes side-by-side comparative metrics across four standard scenarios: **Base**, **Optimistic (+2% return)**, **Conservative (-2% return)**, and **Custom**.

## Consequences
- Allows instant risk-free scenario testing.
- Simulation snapshots can be saved to `simulation_snapshots` table for historical tracking without altering live holdings.
