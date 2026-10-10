# Speech Cloud — Deployment Guide (VL-160)

This guide points at the **existing** production paths. Speech Cloud ships inside the API/web containers; there is no separate Speech Cloud deployable.

## Paths

1. **Fly.io (default)** — [`infra/DEPLOY.md`](../../infra/DEPLOY.md)
2. **AWS EKS `af-south-1` (optional)** — [`infra/AWS_EKS.md`](../../infra/AWS_EKS.md)

## Pre-flight

1. Apply migrations (`prisma migrate deploy` / Fly `release_command`) — includes speech tables (`speech_vocabulary_terms`, `speaker_*`, `wake_keywords`, `call_records`, …).
2. Ensure Postgres is reachable; Redis (`REDIS_URL`) for rate limits/jobs — do not use `JOBS_INLINE=1` in production.
3. Configure Clerk + `CORS_ORIGIN`.
4. Configure `OPENAI_API_KEY` for live Whisper STT / OpenAI TTS.
5. Optional: ElevenLabs for clones; `OWN_TTS_URL` for own TTS; Stripe for billing entitlements.
6. Optional: `DOCUMENT_STORAGE_DIR` for call recording uploads / documents.

## Post-deploy smoke

```bash
curl -sS "$API/v1/speech/products" | head
curl -sS "$API/v1/speech/engine"
curl -sS "$API/v1/speech-analytics/engine"
curl -sS "$API/health"
```

Authenticated:

```bash
curl -sS -H "Authorization: Bearer $VL_KEY" "$API/v1/speech-analytics/overview"
curl -sS -H "Authorization: Bearer $VL_KEY" "$API/v1/speech/overview"
```

## Related docs

- [`docs/SPEECH_CLOUD.md`](../SPEECH_CLOUD.md)
- [`docs/speech-cloud-audit/PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)
- ADR-0079 (audit), ADR-0080 (cloud blueprint)
