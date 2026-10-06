# AI Fabric — Deployment Guide (VL-248)

Reuse platform deploy docs — AI Fabric adds Nest modules, not a separate deployable.

## Paths

- Fly / general: `infra/DEPLOY.md`
- Optional EKS: `infra/AWS_EKS.md` (primary region `af-south-1`)

## Environment

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | Postgres |
| `REDIS_URL` | Event Fabric Streams (omit + `EVENT_FABRIC_MEMORY=1` for memory bus) |
| `EVENT_FABRIC_MEMORY` | `1` for in-process bus (tests/dev) |
| `VERBALAB_POLICY_RUNTIME_MODE` | `enforce` (default) — hard gate |
| Clerk / API keys | Tenant auth |

## Health

- `GET /health`
- Fabric catalogs: `GET /v1/{ai,event,context,knowledge,prompt,reasoning,memory,agent,policy}-fabric/products`
