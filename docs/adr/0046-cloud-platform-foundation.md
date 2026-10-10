# ADR-0046: Cloud Platform Foundation (modular, not a control plane)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-125 (library “Phase 1 Cloud Platform Foundation” mapped)

## Context

Library Phase 1 asks for Accounts, Projects, AZs, Service Discovery, Feature Flags, Cloud Dashboard, etc. Lugemi already ships org/workspace tenancy, Clerk identity, Stripe billing, residency islands, notifications, and an AppShell console. Regenerating a hyperscaler control plane would fake completeness.

## Decision

1. **Map, don’t clone:** Document library terms → existing modules in `docs/CLOUD_PLATFORM_FOUNDATION.md`.
2. **Projects = Workspaces:** No third hierarchy tier. Extend workspace CRUD + `X-Lugemi-Workspace-Id` session override.
3. **Billing Account = Organization** Stripe fields (already).
4. **Regions = residency islands** (VL-075). **AZs / Service Discovery = not built** (Fly single-region islands + `/health`).
5. **Feature flags:** Thin org-scoped map from plan + env kill-switches (`GET /v1/feature-flags`), not LaunchDarkly.
6. **Cloud Dashboard:** Console `/dashboard` + `GET /v1/cloud/overview` composing billing, residency, workspace, flags.
7. **Extend** Nest/Next; do not regenerate identity, billing, or regions modules.

## Consequences

- Multi-workspace orgs become operable without a Project entity rewrite.
- Library “Cloud Foundation” is honest: foundation of every product cloud = this tenancy + console, not a mesh.
