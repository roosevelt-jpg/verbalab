# Voice Cloud — Deployment Guide (VL-179)

This guide points at the **existing** production paths. Voice Cloud ships inside the API/web containers; there is no separate Voice Cloud deployable.

## Paths

1. **Fly.io (default)** — [`infra/DEPLOY.md`](../../infra/DEPLOY.md)
2. **AWS EKS `af-south-1` (optional)** — [`infra/AWS_EKS.md`](../../infra/AWS_EKS.md)

## Pre-flight

1. Apply migrations (`prisma migrate deploy` / Fly `release_command`) — includes voice tables (`voice_clones`, `voice_listings*`, biometric encryption fields, studio/enhancement profiles, …).
2. Ensure Postgres is reachable; Redis (`REDIS_URL`) for rate limits/jobs — do not use `JOBS_INLINE=1` in production.
3. Configure Clerk + `CORS_ORIGIN`.
4. Configure TTS keys (`OPENAI_API_KEY` and/or `OWN_TTS_URL`).
5. Optional: ElevenLabs for clones; Stripe for billing entitlements / marketplace commercial flows.
6. Optional: biometrics encryption key env as documented in `VOICE_BIOMETRICS.md`.

## Post-deploy smoke

```bash
curl -sS "$API/v1/voice-cloud/products" | head
curl -sS "$API/v1/tts/engine"
curl -sS "$API/v1/voice-marketplace/engine"
curl -sS "$API/v1/voice-analytics/engine"
curl -sS "$API/health"
```

Authenticated:

```bash
curl -sS -H "Authorization: Bearer $VL_KEY" "$API/v1/voice-analytics/overview"
curl -sS -H "Authorization: Bearer $VL_KEY" "$API/v1/voice-cloud/overview"
```

## Related docs

- [`docs/VOICE_CLOUD.md`](../VOICE_CLOUD.md)
- [`docs/voice-cloud-audit/PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)
- ADR-0090 (audit), ADR-0080 (cloud blueprint)
