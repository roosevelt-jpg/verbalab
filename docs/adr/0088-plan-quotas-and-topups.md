# ADR-0088: Product Plan Quotas and Top-Up Purchases

- **Status:** Accepted
- **Date:** 2026-10-10

## Context

Voice and language intelligence products need granular per-product quotas based on plan subscription:
- Speech synthesis / TTS characters
- Speech recognition / STT minutes
- Machine translation characters
- Conversational chat / agent tokens
- OCR pages

When users exhaust their included monthly plan quotas, workflows should not abruptly stop without an option to continue: users can purchase top-up token and character packs at a fee. Platform admins must also be able to inspect and update plan quotas and assign/upgrade/downgrade plans.

## Decision

1. **Granular Plan Product Quotas**:
   - `plan_catalog_entries` table in PostgreSQL / Prisma stores base quotas per product (TTS chars, STT minutes, translate chars, chat tokens, OCR pages) alongside pricing, workspace limits, and features.
   - The exactly 4 base plans (Free $0 / Pro $99 / Business $330 / Enterprise custom) are seeded by default and remain canonical unless custom enterprise plans are provisioned by platform admins.

2. **Per-Product Quota Metering & Enforcement**:
   - `/v1/audio/speech`: checks TTS character quota (`assertProductQuota(orgId, 'tts', chars)`).
   - `/v1/audio/transcriptions` & `/v1/speech/recognize`: checks STT minute quota (`assertProductQuota(orgId, 'stt', seconds)`).
   - `/v1/translate`: checks translation character quota (`assertProductQuota(orgId, 'translate', chars)`).
   - `/v1/chat/completions`: checks chat token quota (`assertProductQuota(orgId, 'chat', tokens)`).
   - When exceeded, endpoints return clear HTTP 402 `quota_exceeded` error prompting users to top up or upgrade plan under `/billing`.

3. **Top-Ups (Credit Packs)**:
   - Defined in catalog (`topup_tts_100k`, `topup_tts_500k`, `topup_stt_60m`, `topup_translate_200k`, `topup_chat_500k`).
   - If Stripe keys (`STRIPE_SECRET_KEY`, price IDs, and webhook secret) are configured, creates a Stripe Checkout Session with metadata `type: 'topup_purchase'` and records credits upon webhook fulfillment.
   - If Stripe keys are unconfigured (local/dev/testing), falls back to direct mock fulfillment: records a completed `top_up_purchases` ledger entry and applies credits immediately.
   - Top-up credits never expire and apply additively whenever base monthly quotas are exhausted.

4. **Admin Plan Catalog & User Assignment**:
   - Platform admins at `/admin` (`/admin/workspaces` -> Plan catalog tab) can view, edit quotas on existing plans, and create custom client plans.
   - Admin workspace actions support upgrade/downgrade of user organization plans.

5. **No Competitor Names**:
   - All models, copy, code, and UI strictly adhere to Lugemi branding and generic industry terminology without mentioning competitor platforms.
