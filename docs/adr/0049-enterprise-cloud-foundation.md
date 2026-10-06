# ADR-0049: Enterprise Cloud Foundation (compose governance, not a GRC product)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-128 (library “Phase 4 Enterprise Cloud Foundation” mapped)

## Context

Library Phase 4 asks for Workspace Management, Enterprise/Security/Compliance/Billing/Cloud Policies, Tenant Isolation, Governance, and Administration. VerbaLab already ships workspaces (VL-012/125), data governance (VL-073), residency islands (VL-075), platform admin (VL-081), tenant isolation (VL-072), RBAC (VL-126), and billing quotas (VL-031/071). Building a Policy-as-Code / Trust Center product would regenerate those phases.

## Decision

1. **Map, don’t clone:** Document library terms → modules in `docs/ENTERPRISE_CLOUD.md`.
2. **Policies = derived read model** from org settings, plan/quota, residency, disable state, and RBAC — not a DSL engine.
3. **Enterprise hub:** `/enterprise` + `GET /v1/enterprise/overview` + `GET /v1/enterprise/policies`.
4. **Vendor training flag:** Surfaced in policies and translate audit metadata; enforcement remains contractual/vendor defaults (`allowVendorTraining` default false). No fake zero-retention toggle on every adapter.
5. **Compliance certifications / automated retention sweeper / ABAC:** Deferred (ADR-0022, ADR-0047).
6. **Extend** Nest/Next; do not regenerate Clerk, Stripe, admin, or regions.

## Consequences

- Enterprise RFPs get one honest control plane snapshot.
- No SOC2-as-a-feature product; Trust stays lawyer + VL-072/073 artifacts.
