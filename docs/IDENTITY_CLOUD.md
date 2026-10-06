# Lugemi Identity Cloud

**Status:** Accepted (VL-126)  
**Rule:** Clerk is the human IdP. Lugemi owns tenant RBAC, API keys (machine identity), and audit. Do not regenerate auth or invent SAML/SCIM/ABAC.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Authentication | Clerk (`ClerkAuthGuard`, Next middleware) |
| Authorization | Membership RBAC + platform admin allowlist |
| Organizations | `organizations` + optional `clerkOrgId` |
| Users | `users` synced from Clerk on session |
| Teams | **Not built** — use **workspaces** or Clerk; no Team entity |
| RBAC | `owner` / `admin` / `member` + membership PATCH/DELETE |
| ABAC | **Not built** (explicit non-goal) |
| OAuth2 / OIDC / JWT | Via Clerk session tokens |
| API Keys | `lg_live_…` hashed keys, workspace-scoped |
| Machine Identity | Same API keys (`GET /v1/api-keys`, `lastUsedAt`) |
| SSO / SAML / SCIM | **Buy** Clerk Enterprise or WorkOS when contracted |
| Passkeys / MFA | **Clerk product** — not reimplemented |
| Audit Logs | `audit_events` + `/audit` |

---

## APIs (VL-126 additions)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/v1/identity/me` | Current session principal |
| GET | `/v1/identity/overview` | Identity dashboard aggregate |
| PATCH | `/v1/organization/members/:id` | Change role (`owner`/`admin`/`member`) |
| DELETE | `/v1/organization/members/:id` | Remove member |

Session: Clerk JWT may include org role claim (`o.rol`); when present and org is Clerk-linked, Lugemi syncs `member`/`admin`/`owner` mapping on sign-in.

Machine auth: Bearer API key updates `lastUsedAt`.

---

## Explicit non-goals

- First-party SAML IdP, SCIM directory sync, passkey ceremony, MFA policy engine  
- ABAC / custom permission graphs  
- Team/group hierarchy separate from workspaces  
- Replacing Clerk with a custom OAuth2 authorization server  

See ADR-0047.
