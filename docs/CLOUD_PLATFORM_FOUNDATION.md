# Lugemi Cloud Platform Foundation

**Status:** Accepted (VL-125)  
**Rule:** Extend the modular monolith. Do not regenerate Clerk/Stripe/regions. Do not invent Availability Zones or Consul-style service discovery.

This is the foundation **every product surface** (translate, voice, marketplace, …) already sits on — not a separate deployable “control plane.”

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Cloud Console | Next AppShell console (`apps/web`) |
| Cloud Accounts | Clerk users ↔ `users` |
| Organizations | `organizations` + memberships |
| Projects | **Workspaces** (no separate Project tier) |
| Workspaces | `workspaces` + `/v1/workspaces` + header override |
| Identity | Clerk + API keys |
| Permissions | `MembershipRole` owner/admin/member + platform admin allowlist |
| Billing Accounts | Organization Stripe customer/subscription |
| Regions | Residency islands `us`/`eu` (`/v1/regions`, org pin) |
| Availability Zones | **Not applicable** — Fly `primary_region` per island |
| Global Settings | Deploy env + org governance (`/data`) |
| Workspace Settings | PATCH workspace name + default langs |
| Cloud Dashboard | `/dashboard` + `GET /v1/cloud/overview` |
| Notifications | Resend (email); no in-app inbox |
| Feature Flags | `GET /v1/feature-flags` (plan + env) |
| Service Discovery | **Not built** — single API URL per island + `/health` |

---

## APIs added (VL-125)

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/v1/workspaces` | List / create |
| GET/PATCH | `/v1/workspaces/:id` | Read / update settings |
| GET | `/v1/feature-flags` | Org-visible flag map |
| GET | `/v1/cloud/overview` | Dashboard aggregate |

Session workspace: send `X-Lugemi-Workspace-Id` with Clerk Bearer token to select a non-default workspace (must belong to the org).

---

## Explicit non-goals

- Microservices registry / AZ failover topology  
- Org → Project → Workspace hierarchy  
- Regenerating billing or identity  
- LaunchDarkly-class flag product  

See ADR-0046.
