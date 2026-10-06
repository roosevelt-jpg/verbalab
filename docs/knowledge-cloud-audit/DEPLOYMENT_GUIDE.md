# Knowledge Cloud — Deployment Guide (VL-203)

This guide points at the **existing** production paths. Knowledge Cloud ships inside the API/web containers; there is no separate Knowledge Cloud deployable.

## Paths

1. **Fly.io (default)** — [`infra/DEPLOY.md`](../../infra/DEPLOY.md)
2. **AWS EKS `af-south-1` (optional)** — [`infra/AWS_EKS.md`](../../infra/AWS_EKS.md)

## Pre-flight

1. Apply migrations (`prisma migrate deploy` / Fly `release_command`) — includes knowledge/taxonomy/KG tables as shipped with VL-062/184/197.
2. Ensure Postgres with pgvector is reachable; Redis (`REDIS_URL`) for rate limits/jobs — do not use `JOBS_INLINE=1` in production.
3. Configure Clerk + `CORS_ORIGIN`.
4. Configure `OPENAI_API_KEY` for embeddings and grounded RAG chat paths.
5. Optional: Stripe for plan entitlements.

## Post-deploy smoke

```bash
curl -sS "$API/v1/knowledge-cloud/products" | head
curl -sS "$API/v1/knowledge-base/engine"
curl -sS "$API/v1/enterprise-search/engine"
curl -sS "$API/v1/ontology/engine"
curl -sS "$API/v1/taxonomy/engine"
curl -sS "$API/v1/enterprise-rag/engine"
curl -sS "$API/v1/knowledge-memory/engine"
curl -sS "$API/v1/knowledge-intelligence/engine"
curl -sS "$API/v1/knowledge-apis/engine"
curl -sS "$API/v1/knowledge-analytics/engine"
curl -sS "$API/health"
```

Authenticated:

```bash
curl -sS -H "Authorization: Bearer $VL_KEY" "$API/v1/knowledge-cloud/overview"
curl -sS -H "Authorization: Bearer $VL_KEY" "$API/v1/knowledge-analytics/overview"
curl -sS -H "Authorization: Bearer $VL_KEY" -X POST "$API/v1/enterprise-search/search" \
  -H 'content-type: application/json' \
  -d '{"query":"refund policy","mode":"keyword","k":5}'
```

## Related docs

- [`docs/KNOWLEDGE_CLOUD.md`](../KNOWLEDGE_CLOUD.md)
- ADR-0104–0114
- [`docs/CLOUD_BLUEPRINT.md`](../CLOUD_BLUEPRINT.md)
