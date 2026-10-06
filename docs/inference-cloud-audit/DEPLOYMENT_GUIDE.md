# Inference Cloud — Deployment Guide (VL-213)

This guide points at the **existing** production paths. Inference Cloud ships inside the API/web containers; there is no separate Inference Cloud deployable.

## Paths

1. **Fly.io (default)** — [`infra/DEPLOY.md`](../../infra/DEPLOY.md)
2. **AWS EKS `af-south-1` (optional)** — [`infra/AWS_EKS.md`](../../infra/AWS_EKS.md)

## Pre-flight

1. Apply migrations (`prisma migrate deploy` / Fly `release_command`) — includes GPU/serving/router/stream/batch/cache/cost tables through VL-211.
2. Ensure Postgres is reachable; Redis (`REDIS_URL`) for rate limits/jobs — do not use `JOBS_INLINE=1` in production.
3. Configure Clerk + `CORS_ORIGIN`.
4. Configure vendor keys for Gateway paths (`OPENAI_API_KEY`, etc.).
5. Set spend-safety env before any real GPU billing account:
   - `VERBALAB_GPU_MAX_INSTANCES`, `VERBALAB_GPU_MAX_SPEND_USD`
   - `VERBALAB_COST_DAILY_CAP_USD`, `VERBALAB_COST_MONTHLY_CAP_USD`
   - Prefer `VERBALAB_GPU_PROVISION_MODE=sandbox` / cost mode `sandbox`
6. Optional: Stripe for plan entitlements.

## Post-deploy smoke

```bash
curl -sS "$API/v1/inference-cloud/products" | head
curl -sS "$API/v1/gpu-platform/engine"
curl -sS "$API/v1/gpu-platform/ceilings"
curl -sS "$API/v1/model-serving/engine"
curl -sS "$API/v1/ai-router/engine"
curl -sS "$API/v1/streaming-runtime/engine"
curl -sS "$API/v1/batch-runtime/engine"
curl -sS "$API/v1/intelligent-cache/engine"
curl -sS "$API/v1/cost-optimization/engine"
curl -sS "$API/v1/ai-runtime-analytics/engine"
curl -sS "$API/health"
```

Authenticated:

```bash
curl -sS -H "Authorization: Bearer $VL_KEY" "$API/v1/inference-cloud/overview"
curl -sS -H "Authorization: Bearer $VL_KEY" "$API/v1/cost-optimization/budgets"
curl -sS -H "Authorization: Bearer $VL_KEY" -X POST "$API/v1/ai-router/resolve" \
  -H 'content-type: application/json' \
  -d '{"feature":"chat","optimize":"cost"}'
curl -sS -H "Authorization: Bearer $VL_KEY" "$API/v1/ai-runtime-analytics/overview"
```

## Related docs

- [`docs/INFERENCE_CLOUD.md`](../INFERENCE_CLOUD.md)
- ADR-0115–0124
- [`docs/CLOUD_BLUEPRINT.md`](../CLOUD_BLUEPRINT.md)
