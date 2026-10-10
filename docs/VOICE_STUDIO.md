# Lugemi Voice Studio

**Status:** Collaborative workspace shipped (guide v1 + VL-174 hub)  
**Rule:** Script → translation → speech → native review → approved export. Linear timeline + SSML lite tools remain available. **Not** a nonlinear DAW / Descript / Premiere product. Vendors do **not** receive SSML markup. AI ratings are never native-speaker approval.

---

## Workflow

1. Create a private workspace project (source language + review policy).
2. Import UTF-8 script → immutable `StudioSourceRevision` with stable segment IDs.
3. Create a target **edition** (language/variety + verified voice). Unsupported voices return `capability_unavailable`.
4. Generate revision-linked translations (critical-term flags for numbers/negations/currency).
5. Pin pronunciation memory entries; approved aliases apply before TTS.
6. Generate audio takes (real engines only — never formant/beep placeholders on the customer path).
7. Native reviewers score meaning + speech; independent policy blocks producer self-approval when configured.
8. Assemble selected takes (WAV + silence joins) → immutable assembly hash.
9. Approve release pinned to that hash → export WAV + provenance manifest.

States: `draft` → `generating` → `review_required` → `changes_requested` / `assembly_review` → `release_approved` → `exported` (+ `failed` / `cancelled` / `unsupported`).

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/voice-studio` |
| African studio tools (legacy) | `/audio` |
| Workspace API | `/v1/voice-studio/workspace/*` |
| Library / SSML / lexicon / timeline | `/v1/voice-studio/*` (VL-174) |
| Capability note | `GET /v1/voice-studio/workspace/capabilities` |
| Docs | this file + ADR-0085 |

---

## Workspace API (illustrative → implemented)

| Endpoint | Responsibility |
| --- | --- |
| `POST /v1/voice-studio/workspace/projects` | Create tenant-scoped private project |
| `POST …/projects/{id}/scripts` | Append immutable source revision |
| `POST …/projects/{id}/editions` | Create supported language edition |
| `POST …/editions/{id}/translations` | Generate revision-linked translations |
| `POST …/pronunciations` | Propose/approve pronunciation memory entry |
| `POST …/editions/{id}/generations` | Pin inputs and synthesize takes |
| `POST …/editions/{id}/regenerations` | Targeted segment regeneration (+ optional context expand) |
| `POST …/takes/{id}/reviews` | Timestamped/spanned native feedback |
| `POST …/editions/{id}/assemblies` | Select exact takes and join settings |
| `POST …/assemblies/{id}/approvals` | Authorized approval of exact asset hash |
| `POST …/releases/{id}/exports` | Approved immutable WAV + manifest |

Auth: Clerk session **or** API key (`Authorization: Bearer lg_…`) via `TranslateAuthGuard`. Tenant isolation on every query.

---

## Honesty / speech quality

- Demo-safe voices (eSpeak-backed or neural-live) only on generation paths that feed customer previews.
- Formant placeholders and unsupported African L1 voices (e.g. Yoruba/Zulu without checkpoints) return **422**, never a beep.
- eSpeak `--stdout` WAV headers are finalized (`finalizeStreamingWav`) so browsers do not hang/echo.
- Export manifests label `syntheticSpeech: true`. Native review is a human workflow.
- Training eligibility stays `false` until a separate permissioned dataset release.

See also [`SPEECH_DEMO_CAPABILITY.md`](./SPEECH_DEMO_CAPABILITY.md).

---

## Setup (no secrets)

```bash
# DB
pnpm --filter @lugemi/api exec prisma migrate deploy

# Local API + web
pnpm --filter @lugemi/api dev          # :3001
pnpm --filter @lugemi/web exec next dev -H 0.0.0.0 -p 43127

# Optional neural TTS
# OWN_TTS_URL=http://lugemi-tts.internal:8080
```

Mint a test API key from `/keys` (or seed) and paste it into Voice Studio when Clerk is unavailable.

---

## Rollback

1. Feature-flag / stop using `/v1/voice-studio/workspace/*` clients.
2. `git revert` the workflow migration + service commits if needed.
3. Prior VL-174 library/preview/timeline endpoints remain available.
4. Approved export rows are immutable historical records — deletion follows org retention policy, not silent mutation.

---

## Tests

- `apps/api/src/voice-studio/script-segmenter.spec.ts` — segmentation + critical terms
- `apps/api/test/studio-workflow.spec.ts` — end-to-end workflow + unsupported voice + stale hash
- Existing `apps/api/test/voice-studio.spec.ts` — VL-174 hub

---

## Deferred (explicit)

Video dubbing, lip sync, soundtrack separation, public voice marketplace, live calls, unauthorized cloning, compressed export profiles beyond WAV master, object-storage offload for large takes (MVP stores private base64 with tenant isolation).

VoiceBridge/DealBridge may reuse dictionaries and verified voices but Studio approval does **not** imply customer message approval.
