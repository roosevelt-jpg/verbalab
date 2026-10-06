# ADR-0157: Workflow Marketplace (sandbox + Policy before third-party run)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-255 (library “Phase 122 Workflow Marketplace” mapped)

## Context

Library Phase 122 asks for a Workflow Marketplace covering automation/workflow templates, industry/business packs, AI chains, approval workflows, scheduling templates, plus REST/SDK/dashboard/monitoring/docs.

Volume 11 requires sandboxing + Policy enforcement before third-party marketplace workflows execute. Workflow Runtime (VL-220) already provides sandbox + WorkflowPolicyGate. Inventing Zapier/Temporal/Airflow would violate “extend, don’t regenerate.”

## Decision

1. **Ship VL-255** as `/workflow-marketplace` over `MarketplaceListing` `kind=workflow` with hub marker `snapshot.hub=workflow-marketplace`.  
2. **Publish** from existing Workflow Runtime definitions; permissions and steps must be ⊆ grantable allowlist.  
3. **Install** creates + activates a sandboxed workflow copy in the buyer workspace.  
4. **Run** path: FabricPolicyGate → WorkflowRuntime.run → WorkflowPolicyGate (hard deny). Probe path for denied actions returns `denied` without live execution.  
5. **Honesty:** `sandboxRequired: true`, `liveStepExecution: false`, `zapierOs: false`, `temporalOs: false`, `storesRawCardData: false`, `stripeOrEquivalentRequired: true`.  
6. **Revenue sharing** records `MarketplaceSale` with 15% platform fee.

## Consequences

- Ecosystem catalog marks Workflow Marketplace shipped.  
- Connector Marketplace (VL-256) can mirror the hub pattern next without inventing iPaaS OS.
