# Foundation Model Cloud — Deployment Guide (VL-238)

**Date:** 2026-10-03

## Default path

Same platform deploy as Volumes 1–8:

1. Follow [`infra/DEPLOY.md`](../../infra/DEPLOY.md) (Fly.io).
2. Optional multi-region / EKS: [`infra/AWS_EKS.md`](../../infra/AWS_EKS.md) (`af-south-1`).

## Env notes for this volume

| Concern | Env / surface |
| --- | --- |
| Auth | Clerk (console + overview routes) |
| Training launch | `MODAL_*` / `VERTEX_*` / `TRAINING_FIXTURE` — manual default honest |
| Live eval | `EVAL_LIVE=1` only when intentional |
| Serving | Existing Gateway + Model Serving — not regenerated |

## Smoke after deploy

```bash
curl -sS "$API/v1/foundation-model-cloud/products" | head -c 400
curl -sS "$API/v1/model-training-platform/engine" | head -c 400
curl -sS "$API/v1/model-evaluation-platform/engine" | head -c 400
curl -sS "$API/v1/model-registry/engine" | head -c 400
curl -sS "$API/v1/models/live" | head -c 400
```

## Out of scope

- Standing up a dedicated GPU training cluster for Atlas-class models  
- AI Fabric service mesh (Volume 10)
