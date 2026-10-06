# ADR-0152: Plugin Marketplace (sandboxed + Policy-gated)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-250 (library “Phase 117 Plugin Marketplace” mapped)

## Context

Library Phase 117 asks for an enterprise Plugin Marketplace: publishing, installation, updates, versioning, security, reviews, ratings, analytics, monetization, verification — plus REST/SDK/dashboard/monitoring/docs.

Volume 11 README requires that Volume 8 Plugin Runtime sandboxing be **actually enforced** before third-party marketplace plugins execute for other users. Inventing a browser/VS Code extension OS or bypassing PluginPolicyGate would violate prior ADRs (0132, 0151).

## Decision

1. **Ship VL-250** as `/plugin-marketplace` over Plugin Runtime + existing `MarketplaceListing` rows with `kind=plugin`.  
2. **Publish** freezes a verified plugin snapshot (permissions ⊆ grantable allowlist; denied actions rejected; `sandboxOnly: true`).  
3. **Install** registers + activates a sandboxed plugin in the buyer workspace via Plugin Runtime — never copies live executable payloads.  
4. **Run** is the only execution entry from the marketplace: FabricPolicyGate → `PluginRuntimeService.invoke` → PluginPolicyGate → sandboxed handlers.  
5. **Reviews/ratings** use MemoryRecords; monetization records `MarketplaceSale` (Stripe Connect remains VL-092).  
6. Honesty: `liveCodeExecution: false`, `browserExtensionOs: false`, `regeneratesPluginRuntime: false`.  
7. Add `plugin-marketplace` to Policy Fabric `FABRIC_BUSES` so marketplace actions hard-gate.

## Consequences

- Ecosystem catalog marks Plugin Marketplace shipped.  
- Agent Marketplace (VL-254) should mirror this sandbox + Policy pattern.  
- Creator Economy (VL-258) may deepen payout math; this phase only records sale receipts.
