# Lugemi Relay — verification

## Automated

```bash
cd apps/api && pnpm test -- test/relay.spec.ts test/african-markets.spec.ts
```

Coverage includes:

- Regulated domains (medical/legal) rejected
- Interval overlap detection with setup buffer
- Deterministic matching without inventing supply
- Catalog has no MVP/TODO stubs; instant staffing and processor flags false
- ≥50 African markets and 100+ Relay corridors wired (incl. NG Yoruba, ZA Zulu, KE Swahili, ET Amharic, RW Kinyarwanda)
- Nigeria Yoruba request returns NGN quote through the same pipeline as Ghana
- Request → offer → quote → mark-paid → context → correction (stale grant) → join → extension → complete
- Idempotent request and payment keys
- Concurrent second booking on same window rejected (409)
- Interpreter authority cannot confirm business terms
- Ops overview reports approved interpreters

## Manual console

1. Open `/relay` with Clerk session or API key + actor id (`RELAY_OPEN=1`, `RELAY_ALLOW_TEST_ACTORS=1`, `RELAY_ALLOW_DEMO_INTERPRETERS=1`).
2. Confirm coverage shows labeled demo staffed supply and open slots.
3. Create a request for `ak-en-business` / general business.
4. Accept offer (demo path) and accept pinned quote → booking `awaiting_payment`.
5. Mark manual invoice paid → grant scoped context → join lobby → complete.
6. Record a source correction and confirm grant shows stale.
7. Approve a +15 minute extension before exceeding the quote ceiling.
8. Submit feedback and open a dispute; check `/relay/ops`.
9. Confirm `/relay/offers` lists pending offers for interpreter actors.

## Honesty checks

- Unmatched windows stay unmatched — no fictional interpreter connection.
- Medical/legal categories return domain disabled.
- Demo supply badge never claims hired continent-wide coverage.
- Payment mode remains manual invoice until a processor is authorized.
- Interpreter cannot confirm DealBridge/MeetingBridge terms.
