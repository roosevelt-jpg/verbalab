# VerbaLab Developer Cloud Foundation

**Status:** Accepted (VL-127)  
**Rule:** Extend the existing developer portal (VL-030/033). Do not regenerate Clerk, Stripe, or invent OAuth clients / sandbox clusters.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Developer Accounts | Clerk users |
| Organizations | `organizations` |
| Projects / Applications | **Workspaces** (no separate Application tier) |
| OAuth Clients | **Not built** — Clerk for humans; API keys for machines |
| API Keys | `vl_live_` / `vl_test_` hashed secrets |
| Developer Dashboard | `/developers` + `GET /v1/developer/overview` |
| API Explorer | `/playground` + `GET /v1/openapi.json` |
| CLI | `@verbalab/cli` (thin SDK wrapper) |
| SDK Management | `@verbalab/sdk` + `GET /v1/developer/sdk` |
| Sandbox / Production | Soft key `environment` on **same** cluster (not a second plane) |
| Developer Billing | Org Stripe billing (`/billing`) |
| Documentation | `/docs` + OpenAPI |
| Monitoring | `/usage` + `/analytics` |

---

## APIs (VL-127)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/v1/developer/sdk` | Public | Package versions / install hints |
| GET | `/v1/developer/overview` | Clerk | Hub aggregate |
| POST | `/v1/api-keys` | Clerk | Optional `environment`: `live` \| `test` |

---

## Soft sandbox

- `vl_test_…` keys authenticate like live keys against the **same** API and database.
- Usage still counts toward the org quota.
- Purpose: label non-prod clients in the console — **not** residency/isolation.

---

## Explicit non-goals

- First-party OAuth authorization server / client registry  
- App Store–style Applications  
- Separate sandbox Fly app / database  
- Multi-language SDK factory / public npm release ceremony  
- Full Postman clone  

See ADR-0048.
