# ADR-0156: Agent Marketplace (sandbox + Policy before third-party run)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-254 (library “Phase 121 Agent Marketplace” mapped)

## Context

Library Phase 121 asks for an Enterprise Agent Marketplace covering business/healthcare/government/legal/financial/education/voice/sales/support/research agents, plus REST/GraphQL/SDK/monitoring/analytics/docs.

Volume 11 README requires sandboxing + Policy enforcement before third-party marketplace agents execute for other users. Agent Runtime (VL-219) already provides sandbox + AgentPolicyGate. Inventing LangGraph/AutoGPT would violate “extend, don’t regenerate.”

## Decision

1. **Ship VL-254** as `/agent-marketplace` over `MarketplaceListing` `kind=agent` with hub marker `snapshot.hub=agent-marketplace`.  
2. **Publish** from existing Agent Runtime agents; permissions must be ⊆ grantable allowlist.  
3. **Install** creates + activates a sandboxed agent copy in the buyer workspace.  
4. **Run** path: FabricPolicyGate → AgentRuntime.run → AgentPolicyGate (hard deny).  
5. **Honesty:** `sandboxRequired: true`, `liveToolExecution: false`, `langGraphOs: false`, `autoGptOs: false`, `storesRawCardData: false`, `stripeOrEquivalentRequired: true`.  
6. **Revenue sharing** records `MarketplaceSale` with 15% platform fee.

## Consequences

- Ecosystem catalog marks Agent Marketplace shipped.  
- Workflow Marketplace (VL-255) can mirror the hub pattern next without inventing Zapier OS.
