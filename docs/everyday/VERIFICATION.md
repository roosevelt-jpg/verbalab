# Lugemi Everyday — verification

## Local smoke

```bash
pnpm --filter @lugemi/api exec vitest run test/everyday.spec.ts
# or jest path used by the API package:
pnpm --filter @lugemi/api test -- everyday.spec.ts
```

## Manual path

1. Sign in (or API key + `X-Everyday-Actor-Id`).
2. Open [Everyday](/everyday), choose **Read this to me** and corridor `en-ak`.
3. Upload a TXT/PNG school notice with a deadline, amount, and reference with leading zeros.
4. Confirm OCR preview; run **Translate** and **Explain** as separate tabs.
5. Ask “By when?” — answer cites a block; blurred uploads request recapture.
6. Draft a reply, approve with matching hashes, confirm clipboard export only.
7. Explain a term from the document; delete the session and confirm history removes it.

## Acceptance coverage (automated)

| Case | Covered |
| --- | --- |
| Blurred deadline → recapture | unit + API |
| Evidence block validation | unit |
| Unreadable → no invented deadline | unit |
| Leading zeros / refs survive fixture MT | API |
| Explanation disclaimer | API |
| Source edit invalidates downstream | API 409 |
| Reply approval hash pinning | API |
| Unauthorized private / cross-tenant | API |
| Sensitive category gate | API |
| Deletion tombstone | API |

## Honesty

- Fixture OCR/MT/TTS are labeled in revision `modelVersion` / audio `status` and require `EVERYDAY_ALLOW_FIXTURE_*` (or `NODE_ENV=test`).
- Neighboring-language TTS is never substituted; unsupported varieties return text with `audio_unavailable` / `status=unsupported`.
