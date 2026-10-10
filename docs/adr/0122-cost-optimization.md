# ADR-0122: Cost Optimization Engine (enforce caps, not FinOps OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-211 (library “Phase 78 Cost Optimization Engine” mapped)

## Context

Volume 7 README requires Phase 78 to **enforce** spend limits, not only report cost after the fact. Library asks for dynamic routing, GPU/provider cost optimization, autoscaling, spot, reserved capacity, prediction, dashboard/REST/monitoring/reports/docs.

Inventing a cloud FinOps OS, AWS Spot broker, or reserved-instance marketplace would overshoot and risk false confidence before a real GPU bill.

## Decision

1. Ship `/v1/cost-optimization/*` + `/cost-optimization` with Postgres `CostBudget` + `CostSpendEvent`.
2. Default hard daily/monthly USD caps from env; workspace budgets upsertable with `enforce` default true.
3. `record` / `check` throw **402** when over cap; AI Router `resolve` calls the same gate.
4. `optimize` ranks Gateway candidates by estimated USD; GPU view reuses VL-205 ceilings.
5. Spot/reserved are **sandbox planning fields** only (`preferSpot`, `reservedCapacityUnits`) — no cloud APIs.
6. Predictions use linear ledger extrapolation — not ML demand forecasting OS.
7. Flip Inference Cloud catalog `cost-optimization` to partial; deferred flag → false.

## Consequences

- Spend safety is enforceable in sandbox before any production cloud billing account is connected.
- AI Router remains dry-run for provider calls but refuses plans when the workspace is already over caps.
- True Spot/RI brokerage and FinOps warehouses remain out of scope.
