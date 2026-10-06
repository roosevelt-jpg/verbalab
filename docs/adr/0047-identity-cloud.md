# ADR-0047: Identity Cloud (Clerk + VerbaLab RBAC, not a IdP rewrite)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-126 (library “Phase 2 Identity Cloud” mapped)

## Context

Library Phase 2 asks for Authentication, Authorization, Orgs, Users, Teams, RBAC, ABAC, OAuth2, OIDC, JWT, API Keys, Machine Identity, SSO, SAML, SCIM, Passkeys, MFA, Audit Logs. VerbaLab already uses Clerk for human identity and ships org memberships, API keys, and audit events. Rebuilding an IdP would regenerate Phase 1 and violate buy-vs-build.

## Decision

1. **Map, don’t clone:** Document library terms → modules in `docs/IDENTITY_CLOUD.md`.
2. **Human auth = Clerk** (OAuth2/OIDC/JWT session). MFA/passkeys/SAML/SCIM stay **Clerk Enterprise / WorkOS** when a contract requires them — not first-party VerbaLab.
3. **RBAC = `MembershipRole` owner | admin | member.** Ship membership promote/demote/remove APIs + optional Clerk org-role claim sync. **No ABAC.**
4. **Teams = not a fourth hierarchy.** Use workspaces (VL-012/125) or Clerk; do not invent Team entities.
5. **Machine identity = workspace-scoped API keys** (`vl_live_…`) with `lastUsedAt` touch on authenticate.
6. **Audit = existing `audit_events`** (membership mutations recorded).
7. **Identity console** `/identity` + `GET /v1/identity/overview` compose the surface — extend Nest/Next; do not regenerate Clerk.

## Consequences

- Enterprise SSO checklists are answered honestly (buy IdP features).
- Org owners can manage VerbaLab roles without waiting for Clerk dashboard alone.
- API keys remain the only machine principal; no mTLS / custom OAuth AS.
