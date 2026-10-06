# ADR-0048: Developer Cloud Foundation (portal hub, not a second control plane)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-127 (library “Phase 3 Developer Cloud Foundation” mapped)

## Context

Library Phase 3 asks for Developer Accounts, Applications, OAuth Clients, CLI, SDK Management, Sandbox vs Production planes, etc. Lugemi already ships API keys, OpenAPI, `/docs`, `/playground`, `@lugemi/sdk`, Stripe billing, and usage/analytics (VL-030/031/033). Regenerating that stack or inventing an OAuth AS would duplicate Identity Cloud (ADR-0047).

## Decision

1. **Map, don’t clone:** Document library terms → modules in `docs/DEVELOPER_CLOUD.md`.
2. **Developer Accounts / Orgs = Clerk + organizations** (already).
3. **Projects / Applications = workspaces** (VL-012/125). No App Store Application entity.
4. **OAuth Clients = not built** — human OAuth stays Clerk; machine auth = API keys.
5. **Sandbox vs Production = soft key environments** on the same cluster: `lg_live_` / `lg_test_` prefixes + `ApiKey.environment`. Not a second Fly/DB plane.
6. **API Explorer = `/playground`** (translate + detect + languages) + OpenAPI.
7. **SDK Management = package metadata** (`GET /v1/developer/sdk`) + README; not a multi-SDK portal.
8. **CLI = thin `@lugemi/cli`** wrapping the TypeScript SDK (translate / languages / whoami).
9. **Developer Dashboard = `/developers`** + `GET /v1/developer/overview` composing keys, usage, billing, docs links.
10. **Billing / Monitoring = existing** Stripe + usage + analytics — do not regenerate.

## Consequences

- Developers get a single hub without a fake sandbox island.
- Test keys share quota/DB with live (documented); isolate later only if a contract demands a plane.
- OAuth client registry remains out of scope.
