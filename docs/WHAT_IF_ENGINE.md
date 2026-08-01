# What-If Simulation Engine Specification

## Overview
The `WhatIfSimulationEngine` performs real-time, zero-mutation scenario projections. It allows users to test financial hypotheses (e.g. SIP step-up, early retirement, lump sum investment, goal targets, inflation rates) without altering live portfolio ledgers.

---

## Scenario Comparison Matrix
For every simulation run, four side-by-side scenarios are evaluated:
1. **Base Case**: Baseline expected return (12%) & inflation (6%).
2. **Optimistic Scenario**: High growth return (+2%) with 15% SIP step-up.
3. **Conservative Scenario**: Stress-tested return (-2%) with higher inflation (+1%).
4. **Custom Scenario**: User-defined parameter configuration.
