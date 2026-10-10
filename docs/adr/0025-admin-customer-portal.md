# ADR-0025: Admin + customer portal

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-081

## Context

Without an internal admin console we SSH to production. Customers need members visibility alongside plan/billing. We will not build Mission Control.

## Decision

1. **Customer:** `GET /v1/organization/members` + members panel on `/billing`. Invites stay in Clerk. Plan/invoices remain Stripe portal.
2. **Platform admin:** `ADMIN_EMAILS` / `ADMIN_USER_IDS` allowlist (not org RBAC). Routes under `/v1/admin/*` and console `/admin`.
3. **Actions:** search orgs, view usage/keys/members, revoke-all keys, set `disabledAt` (also revokes keys). ApiKeyGuard / TranslateAuth reject disabled orgs (`org_disabled`).
4. **Out of scope:** sci-fi Mission Control, invite CRUD, impersonation.

## Consequences

- Empty allowlist ⇒ no platform admins (safe default).
- Disabled orgs can still be re-enabled by an allowlisted admin.
