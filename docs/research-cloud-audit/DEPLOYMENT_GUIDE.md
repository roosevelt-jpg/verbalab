# Research Cloud — Deployment Guide (VL-280)

## Runtime

Research Cloud hubs ship inside the existing Nest API (`apps/api`) and Next.js console (`apps/web`).

## Config

- Clerk auth for `/v1/research-cloud/overview`
- Public engine/products/monitoring catalogs for discovery
- Shared infra: `infra/DEPLOY.md`, optional EKS `infra/AWS_EKS.md`

## Post-deploy smoke

1. `GET /v1/research-cloud/products` — all products `shipped`
2. `GET /v1/synthetic-data-platform/artifacts` — `allSynthetic=true`
3. `GET /v1/open-science-platform/check?id=os-dataset-restricted` — `allowed=false`
4. GraphQL `researchCloudProducts` query succeeds
