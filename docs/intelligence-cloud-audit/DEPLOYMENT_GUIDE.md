# Intelligence Cloud — Deployment Guide (VL-192)

This guide points at the **existing** production paths. Intelligence Cloud ships inside the API/web containers; there is no separate Intelligence Cloud deployable.

## Paths

1. **Fly.io (default)** — [`infra/DEPLOY.md`](../../infra/DEPLOY.md)
2. **AWS EKS `af-south-1` (optional)** — [`infra/AWS_EKS.md`](../../infra/AWS_EKS.md)

## Pre-flight

1. Apply migrations (`prisma migrate deploy` / Fly `release_command`) — includes memory/knowledge-graph tables as shipped with VL-183/184.
2. Ensure Postgres with pgvector is reachable; Redis (`REDIS_URL`) for rate limits/jobs — do not use `JOBS_INLINE=1` in production.
3. Configure Clerk + `CORS_ORIGIN`.
4. Configure `OPENAI_API_KEY` for chat completions and embeddings.
5. Optional: Stripe for plan entitlements affecting Decision Engine policy gates.

## Post-deploy smoke

```bash
curl -sS "$API/v1/intelligence-cloud/products" | head
curl -sS "$API/v1/embedding-cloud/engine"
curl -sS "$API/v1/vector-cloud/engine"
curl -sS "$API/v1/memory-cloud/engine"
curl -sS "$API/v1/reasoning-cloud/engine"
curl -sS "$API/v1/intelligence-analytics/engine"
curl -sS "$API/health"
```

Authenticated:

```bash
curl -sS -H "Authorization: Bearer $VL_KEY" "$API/v1/intelligence-cloud/overview"
curl -sS -H "Authorization: Bearer $VL_KEY" "$API/v1/intelligence-analytics/overview"
curl -sS -H "Authorization: Bearer $VL_KEY" -X POST "$API/v1/ai-orchestration/run" \
  -H 'content-type: application/json' \
  -d '{"pipeline":"detect_translate","text":"Hello","target":"sw"}'
```

## Related docs

- [`docs/INTELLIGENCE_CLOUD.md`](../INTELLIGENCE_CLOUD.md)
- [`docs/intelligence-cloud-audit/PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)
- ADR-0103 (audit), ADR-0080 (cloud blueprint)
