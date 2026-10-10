# Lugemi Language Integrity

**Status:** Shipped product surface  
**Marketing:** `/p/legal-integrity`  
**Console:** `/language-integrity`  
**Rule:** Extend watermark, consent, audit, and translation review. Do not invent NIST PAD or courtroom certification theater.

---

## Why it exists

Synthetic voices can be offered as if they were live testimony. Lugemi helps governments and courts **require provenance** for generative speech and **human review** for official bilingual filings — so innocents are not judged on unattested fakes, and ministries ship mother-tongue notices with accountable translation.

Africa-first: trade desks, civic FAQ, education, and head-of-state briefing language on the same `/v1` surface.

---

## What ships (honest)

| Control | Reality |
| --- | --- |
| Synthetic disclosure | Clone speech sets `X-Lugemi-Watermark: required` |
| Consent-gated clones | `GET /v1/voice-cloning/consent/policy` + attested enrollment |
| Abuse review | Clones start `pending_review` → approve/reject/disable |
| Provenance verify | `POST /v1/language-integrity/verify` checks metadata claims |
| Workspace verify | `POST /v1/language-integrity/verify/workspace` resolves clone library |
| Audit | `GET /v1/audit-events` (`voice_clone.*` and org events) |
| Official translation review | `GET /v1/reviews` + accept/reject (TM upsert on accept) |
| Adoption protocol | `GET /v1/language-integrity/protocol` |

---

## What we do **not** claim

- Foolproof deepfake / PAD detection (NIST biometrics stays deferred to Voice Biometrics)
- Automatic courtroom certification or legal advice
- That missing a Lugemi watermark proves audio is human

---

## Government protocol (adoption-grade)

1. **Require Lugemi attestation** for synthetic media offered into proceedings or public messaging (watermark + consented approved clone + audit ids).
2. **Mandatory disclosure** — generative/cloned speech labeled; watermark cannot be disabled on clone paths.
3. **Consent-only clones** — no enrollment without attestation and review.
4. **Human review** for official bilingual filings via Translate → Reviews.
5. **Retain audit logs** for the window counsel sets.

---

## API quickstart

```bash
curl -s http://127.0.0.1:3001/v1/language-integrity/engine | jq .trust

curl -s -X POST http://127.0.0.1:3001/v1/language-integrity/verify \
  -H 'content-type: application/json' \
  -d '{"watermarkHeader":"required","consentAttested":true,"attestationNotes":"Speaker recorded consent on 2026-03-01","audioClaimText":"Generated speech for civic notice"}'
```

Speech responses include:

```http
X-Lugemi-Watermark: required
```

Related: [`VOICE_CLONING.md`](./VOICE_CLONING.md), [`TRUST_CLOUD.md`](./TRUST_CLOUD.md), Safety `/p/safety`.
