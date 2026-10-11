# Lugemi Everyday — operations runbook

## Surface

- API: `/v1/everyday/*`
- Web: `/everyday`, `/everyday/sessions/:id`, `/everyday/history`
- SDK: TypeScript `client.everyday`
- Entitlement: plan feature `everyday` (Pro+), org `featureOverrides.everyday`, `EVERYDAY_OPEN`, `EVERYDAY_DISABLED`

## Environment

| Variable | Purpose |
| --- | --- |
| `EVERYDAY_DISABLED=1` | Kill switch |
| `EVERYDAY_OPEN=1` | Bypass plan entitlement (local/demo) |
| `EVERYDAY_ALLOW_TEST_ACTORS=1` | Allow `X-Everyday-Actor-Id` without Clerk |
| `EVERYDAY_ALLOW_FIXTURE_OCR=1` | Fixture OCR when Vision unavailable |
| `EVERYDAY_ALLOW_FIXTURE_MT=1` | Fixture MT when translate adapter fails |
| `EVERYDAY_ALLOW_FIXTURE_TTS=1` | Fixture WAV when TTS unavailable |
| `EVERYDAY_MAX_UPLOAD_BYTES` | Default 20 MB |
| `EVERYDAY_MAX_PAGES` | Default 10 |
| `DOCUMENT_STORAGE_DIR` | Private asset root (shared with Documents) |

## Adapter stack

1. Capture quality heuristics → recapture when blurred/obscured/missing pages
2. OCR via Gateway Vision / PDF text / plaintext (fixtures only when allowed)
3. Faithful translation via `TranslateService` (critical token checks)
4. Grounded explanation + Q&A with validated block evidence
5. TTS via `AudioService.speak` + language Echo voices; unsupported stays textual
6. Reply approval pinned to presentation hashes; no external send

## Common errors

| Code | Meaning |
| --- | --- |
| `feature_disabled` | Plan lacks `everyday`, override false, or kill switch |
| `recapture_required` (document status) | Capture quality blocked OCR promotion |
| `ocr_unavailable` | No readable text extracted |
| `output_stale` / `revision_conflict` | Downstream work against inactive source |
| `approval_hash_mismatch` | Reply text changed since the UI hashed it |
| `reply_blocked` | Draft invents payment/admission/date |
| `sensitive_policy_required` | Medical/legal/financial without acknowledgement |
| `audio_unavailable` | TTS unsupported for variety |

## Rollback

1. Set `EVERYDAY_DISABLED=1` and redeploy API.
2. Optionally set `featureOverrides.everyday=false` on affected orgs.
3. Web routes remain but API returns 403.

## Privacy

- Sessions are owner-scoped inside the organization.
- Delete tombstones sessions and unlinks storage keys; downloaded copies cannot be recalled.
- Training consent is optional and off by default.
