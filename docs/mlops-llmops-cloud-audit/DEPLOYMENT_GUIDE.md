# MLOps & LLMOps Cloud — Deployment Guide (VL-291)

## Runtime

MLOps & LLMOps Cloud hubs ship inside the existing Nest API (`apps/api`) and Next.js console (`apps/web`).

## Config

- Clerk auth for `/v1/mlops-llmops-cloud/overview`
- Public engine/products/monitoring catalogs for discovery
- Shared infra: `infra/DEPLOY.md`, optional EKS `infra/AWS_EKS.md`

## Post-deploy smoke

1. `GET /v1/mlops-llmops-cloud/products` — all products `shipped`
2. `GET /v1/continuous-learning/promote-check?id=promo-ready-001` — `allowed=true`, `autoPromote=false`
3. `GET /v1/agentops-platform/monitoring` — `policyViolationsVisible=true`
4. GraphQL `mlopsLlmopsCloudProducts` query succeeds
