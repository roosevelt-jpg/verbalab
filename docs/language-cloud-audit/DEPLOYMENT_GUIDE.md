# Language Cloud — Deployment Guide (VL-147)

This guide points at the **existing** production paths. Language Cloud ships inside the API/web containers; there is no separate Language Cloud deployable.

## Paths

1. **Fly.io (default)** — [`infra/DEPLOY.md`](../../infra/DEPLOY.md)
2. **AWS EKS `af-south-1` (optional)** — [`infra/AWS_EKS.md`](../../infra/AWS_EKS.md)

## Pre-flight

1. Apply migrations (`prisma migrate deploy` / Fly `release_command`).
2. Ensure Postgres has `vector` extension (TM embeddings / knowledge).
3. Set Redis (`REDIS_URL`); do not use `JOBS_INLINE=1` in production.
4. Configure Clerk + `CORS_ORIGIN`.
5. Configure MT (`GOOGLE_TRANSLATE_API_KEY`) for live translate.
6. Optional: `OPENAI_API_KEY` for chat assist, embeddings, Whisper, style/grammar LLM paths.

## Post-deploy smoke

```bash
curl -sS "$API/v1/language/products" | head
curl -sS "$API/v1/analytics"
curl -sS "$API/v1/tm"
curl -sS "$API/health"
```

Authenticated:

```bash
curl -sS -H "Authorization: Bearer $VL_KEY" "$API/v1/analytics/overview"
```

## Related docs

- [`docs/LANGUAGE_CLOUD.md`](../LANGUAGE_CLOUD.md)
- [`docs/language-cloud-audit/PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)
- ADR-0068
