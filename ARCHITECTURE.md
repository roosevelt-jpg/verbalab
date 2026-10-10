# Lugemi AI ? Architecture (MVP-realistic)

This is the **starting** architecture for a small team. It is allowed to disagree with the libraries. When a later phase changes the shape of the system, update this file in the same session.

**North star:** one language-intelligence **API company** with a console, not a hyperscaler replica.

**Phase −1 enterprise blueprint (docs only):** [`docs/ENTERPRISE_PRODUCT_BLUEPRINT.md`](docs/ENTERPRISE_PRODUCT_BLUEPRINT.md) — system/C4 context, DDD, contracts, deploy, security, testing. This file remains the MVP-shaped runtime architecture.

**Cloud Platform Foundation (VL-125):** [`docs/CLOUD_PLATFORM_FOUNDATION.md`](docs/CLOUD_PLATFORM_FOUNDATION.md) — library term → module map (Projects = workspaces; no AZs / discovery).

**Identity Cloud (VL-126):** [`docs/IDENTITY_CLOUD.md`](docs/IDENTITY_CLOUD.md) — Clerk + RBAC + API keys; SAML/SCIM/ABAC/Teams not rebuilt.

**Developer Cloud (VL-127):** [`docs/DEVELOPER_CLOUD.md`](docs/DEVELOPER_CLOUD.md) — portal hub + soft sandbox keys + thin CLI; no OAuth AS.

**Enterprise Cloud (VL-128):** [`docs/ENTERPRISE_CLOUD.md`](docs/ENTERPRISE_CLOUD.md) — compose governance/admin/residency; no policy engine.

**AI Gateway Cloud (VL-129):** [`docs/AI_GATEWAY_CLOUD.md`](docs/AI_GATEWAY_CLOUD.md) — thin gateway + OpenRouter optional fallback; Volume 1A closeout.

**Language Cloud (VL-130):** [`docs/LANGUAGE_CLOUD.md`](docs/LANGUAGE_CLOUD.md) — hub over translate/glossary/TM/locales; no linguistics OS.

**Speech Cloud (VL-150):** [`docs/SPEECH_CLOUD.md`](docs/SPEECH_CLOUD.md) — hub over batch STT/TTS/interpreter/voice; streaming and speech-intelligence products deferred.

**Voice Cloud (VL-170):** [`docs/VOICE_CLOUD.md`](docs/VOICE_CLOUD.md) — hub over neural TTS, consent-gated clones, Voice Studio; emotion/marketplace/biometrics OS deferred.

---

## What we are actually building (now)

A **modular monolith** in one monorepo:

- **Web console** (`apps/web`) ? Next.js App Router
- **Public/API + workers later** (`apps/api`) ? NestJS
- **Postgres** ? the system of record
- **Vendor AI** behind a single gateway module
- **Clerk** (or Better Auth) for identity
- **Stripe** when we reach VL-031

First customer-visible slice: **authenticated org + API key + text translation + usage**. Specified in `PHASE_0_1.md`.

---

## Pushback on the library stacks

v1 Phase 0 asks for, on day one: Turborepo, pnpm, Next.js 16, NestJS, Tailwind, ShadCN, Framer Motion, Docker, **Kubernetes**, **Terraform**, GitHub Actions, **OpenTelemetry + Prometheus + Grafana**, Redis, Postgres, **Elasticsearch**, BullMQ, Clerk, Cloudflare, AWS, Husky, Commitlint, Vitest, Playwright, Storybook ? plus GraphQL *and* REST *and* SDKs on every later phase.

v2 then adds hexagonal/CQRS/event-driven **for every cloud**, plus Control Plane, Data Plane, AI Kernel, AI Fabric, GPU platform, and a six-repository split.

### Keep

| Choice | Why |
| --- | --- |
| **pnpm + Turborepo** | Cheap modularity; matches the library; fine for one team |
| **TypeScript everywhere** | One language across web, API, SDK |
| **Next.js (current stable)** | Console + docs + marketing. Use current stable (library says 16; do not pin to a number that does not exist at install time) |
| **NestJS for `apps/api`** | Clear modules for gateway, billing, translation; can split out later without rewriting HTTP |
| **Postgres** | Tenancy, keys, usage, TM, jobs. One database until it hurts |
| **Tailwind + shadcn/ui** | Fast console; skip Framer Motion until a screen needs it |
| **Vitest** | API and unit tests from Phase 0 |
| **Playwright** | Add in Phase 1 for the translate happy path, not in the empty skeleton |
| **Docker Compose** | Local Postgres + Redis (VL-044; ADR-0005) |
| **GitHub Actions** | `lint`, `typecheck`, `test` |
| **Clerk** | v1 already chose it; Organizations + OAuth in days, not months |
| **Prisma** | Fast schema + migrations for NestJS. Revisit Drizzle only if we hate the client |

### Cut from Phase 0?2 (overkill)

| Library item | Why cut | When to revisit |
| --- | --- | --- |
| Kubernetes | You have one API and no SRE | Sustained load or many services |
| Terraform / AWS account sprawl | PaaS + managed Postgres is enough | Multi-env compliance |
| Elasticsearch | Postgres FTS / `pg_trgm` first | Search product, not logs |
| Redis + BullMQ on day one | Deferred until jobs | Done in VL-044 (ADR-0005) |
| Prometheus + Grafana + self-hosted OTel | Operate nothing extra | K8s era |
| GraphQL | One extra surface to test | A client that needs it |
| Storybook | Console is small | Design-system scale |
| Framer Motion | Polish, not product | Marketing site |
| Cloudflare (full) | Optional later for DNS/CDN | After a real domain |
| Hexagonal + CQRS + event bus per module | Slows a 2-person team | A bounded context that is actually complex |
| REST **and** GraphQL **and** gRPC | Pick REST/JSON | Partner demand |
| Six git repos | Cross-repo PRs will stall you | Org boundaries exist |
| ?AI Kernel / Fabric / VAIOS? | Duplicate of functions + a queue | Never for MVP |

### Clerk vs ?build Identity Cloud?

v1 and v2 specify OAuth2, OIDC, JWT, SAML, SCIM, passkeys, MFA, ABAC, audit ? **and** Clerk. Building that yourself **and** integrating Clerk is two identity companies.

**Decision:** Clerk is the identity system. Our DB stores `clerkUserId` / `clerkOrgId` mappings, roles we must enforce in the API, workspaces, keys, and audit copies we need for product queries. We do **not** implement SAML/SCIM until a contract requires Clerk Enterprise or WorkOS (call that a new phase, not a silent expansion of VL-010).

---

## Logical shape

```text
                    ???????????????
                    ?  Clerk       ?
                    ?  (IdP)       ?
                    ????????????????
                           ? session / JWT
              ???????????????????????????
              ?                         ?
       ???????????????           ???????????????
       ? apps/web    ?  cookie   ? apps/api    ?
       ? Next.js     ????????????? NestJS      ?
       ? console     ?  /v1/*    ?             ?
       ???????????????           ?  Identity   ?
                                 ?  Workspaces ?
                                 ?  ApiKeys    ?
                                 ?  Gateway    ?
                                 ?  Translate  ?
                                 ?  Usage      ?
                                 ???????????????
                                        ?
                          ???????????????????????????????????????????
                          ?             ?             ?             ?
                   ????????????  ????????????  ????????????? ????????????
                   ? Postgres ?  ? Stripe   ?  ? AI vendors? ? Redis    ?
                   ? + jobs   ?  ? (M3)     ?  ? Translate ? ? BullMQ   ?
                   ????????????  ????????????  ? STT/TTS   ? ????????????
                                               ? LLM/OCR   ?
                                               ?????????????
```

**No microservice per cloud.** Translation, speech, and billing are NestJS modules (and later worker processes) sharing one Postgres, one deployment, one OpenAPI.

---

## Target repo layout (Phase 0 ? shipped)

```text
lugemi/
  apps/
    web/                 # Next.js 15 console (health page)
    api/                 # NestJS HTTP API + Prisma
  packages/
    typescript-config/
    eslint-config/
    sdk/                 # placeholder until VL-033
  docs/
    ENGINEERING.md       # VL-001
    adr/
  infra/
    docker-compose.yml   # Postgres :5433 + Redis :6379
  .github/workflows/ci.yml
  pnpm-workspace.yaml
  turbo.json
  package.json
```

**Local Postgres:** Compose publishes **5433?5432** because this machine already had something on 5432. CI still uses the Actions service on 5432. **Redis** is on host **6379** (ADR-0005). Document bytes land in local `DOCUMENT_STORAGE_DIR` (ADR-0006).

---

## API conventions (lock this in VL-001)

- Base path: `/v1`
- Auth: `Authorization: Bearer lg_live_...` for public API; session/Clerk for console BFF routes
- Errors: `{ "error": { "code": "unsupported_language", "message": "...", "request_id": "..." } }`
- Idempotency: `Idempotency-Key` on paid mutations once billing exists
- Versioning: URL version; no header soup
- OpenAPI generated from NestJS, not hand-written forever

---

## Data (Phase 1)

Minimum tables (names indicative):

| Table | Purpose |
| --- | --- |
| `organizations` | Tenant; Clerk org id |
| `users` | Clerk user id |
| `memberships` | user?org?role |
| `workspaces` | belongs to org |
| `api_keys` | hashed secret, prefix, workspace_id |
| `languages` | registry |
| `translation_requests` | metadata (+ optional body per retention policy) |
| `usage_events` | append-only meter |
| `audit_events` | VL-032; a thin version can start in Phase 1 for key create |

**Isolation:** every query that returns customer data is scoped by `org_id` (and tests prove it).

**pgvector:** enabled (VL-062) via `pgvector/pgvector:pg16` ? see ADR-0018.

---

## AI Gateway (VL-021)

One NestJS module, not a sidecar service.

```text
Gateway
  ??? ProviderRegistry
  ??? adapters/googleTranslate.ts    # first
  ??? adapters/openai-chat.ts        # VL-060 chat completions
  ??? retry/timeout
  ??? UsageWriter ? usage_events
```

Rules:

- Controllers never import vendor SDKs directly
- A provider failure is a mapped error, not a 500 stack trace
- Cost estimate is logged even if billing is later
- Adding DeepL is a **new adapter**, not a rewrite

**First translation provider:** Google Cloud Translation **or** Azure Translator (African-language coverage). DeepL is a quality route for languages it actually supports ? second, not first.

---

## AuthN / AuthZ

| Layer | Mechanism |
| --- | --- |
| Human on console | Clerk session |
| Machine on `/v1` | API key (hashed at rest, prefix displayed) |
| Authorization | `owner` / `admin` / `member` on org; keys inherit workspace |
| Audit | Clerk events + our `audit_events` for keys and translations |

Passkeys, MFA enrollment UX, and SAML stay in Clerk?s product. We do not reimplement them.

---

## Frontend

- App Router, server components where they help, client for the translator box
- shadcn/ui + Tailwind
- No global state library until there is real client state (React Query if the console grows)
- Marketing site can wait; a logged-in console is enough for M1?M2

---

## Testing

| Layer | Tool | When |
| --- | --- | --- |
| Unit / API | Vitest + Nest testing module | Phase 0 (`/health`); Phase 1 (translate, keys, tenant isolation) |
| Provider contract | Adapter tests with recorded fixtures **plus** one optional live test gated on env | Phase 1 |
| E2E | Playwright: public `/setup` `/docs` `/coverage` `/health`; signed-in translate when `E2E_CLERK_*` set | Phase 1+ |
| Types | `tsc --noEmit` in CI | Phase 0 |

**Done does not mean:** a `TODO` adapter that returns `"hello"` in French.

If `GOOGLE_TRANSLATE_API_KEY` (or Azure equivalent) is missing, **stop** and ask ? do not ship a fake translator.

---

## Environments

| Env | What |
| --- | --- |
| Local | Compose Postgres, `.env.local`, Clerk dev keys, vendor key |
| CI | Postgres service container, no vendor calls except optional nightly |
| Production (VL-074/075) | Fly.io residency islands (`infra/fly/*.toml` + `*.eu.toml`); each island has its own Postgres+Redis; `LUGEMI_REGION` + org `data_region` pin (ADR-0043) |

No ?dev / staging / prod / gov / sovereign? matrix until there is staff to operate it.

---

## Observability (until VL-070)

Phase 0?1: JSON logs with `request_id`, Nest logger. VL-070: Sentry. Metrics dashboards only when we have traffic.

---

## Security defaults

- API keys: `sha256` of the secret; store prefix only for UI
- TLS at the PaaS edge
- Helmet / security headers on API + web
- Org data settings: retention, `persistSourceText`, `allowVendorTraining` (VL-073); DPA map in `docs/data-map.md`
- No source text in logs by default
- Vendor data-processing: check ?do not train? on Google/Azure/OpenAI before production

---

## What success looks like after Phase 1

A developer can:

1. Sign in
2. Create an API key
3. `curl` `POST /v1/translate` with real Swahili?English (or another seeded pair)
4. See the same result and a character count in the console

That is a company. It is not Translation Cloud + Speech Cloud + Voice Cloud + OCR Cloud + Marketplace + Foundation Models.

---

## Evolution (do not do early)

| Pressure | Possible change |
| --- | --- |
| Document/audio jobs block HTTP | Extract `apps/worker`, add Redis + BullMQ |
| Chat + translate need different scale | Still one API; scale replicas |
| Fine-tunes | Gateway adapter to a rented vLLM / vendor fine-tune endpoint |
| Second region | Done (VL-075): EU island (`*.eu.toml`) + org `data_region` pin; not a fabric |
| Team boundaries | Split `packages/translate` then maybe a repo ? after pain is real |

---

## Mapping to v2 ?clouds?

| v2 cloud | MVP home |
| --- | --- |
| Identity Cloud | Clerk + `apps/api` identity module |
| Developer Cloud | Console pages + OpenAPI + later `packages/sdk` |
| Enterprise Cloud | `organizations` + `workspaces` |
| AI Gateway Cloud | `gateway` module |
| Language Cloud | `languages` + `translate` module |
| Speech Cloud | `speech-cloud` hub + existing `audio` / `interpret` / `voice*` |
| Voice Cloud | `voice-cloud` hub + existing `audio` / `voice-clones` / speaker + enhance |
| Speaker Intelligence | `speaker-intelligence` + local fingerprints / gap diarization |
| Speech / Voice / Vision | Later modules + vendor adapters |
| Everything else | See ROADMAP vision backlog |

---

## Open decisions (resolve before or during Phase 1, not in Phase 0)

1. **IdP:** Clerk ? chosen. Live sign-in blocked until keys are in `.env`.
2. **MT vendor:** Google Cloud Translation (ADR-0002). Live MT blocked until `GOOGLE_TRANSLATE_API_KEY` is set.
3. **PaaS:** Fly.io (ADR-0023) — two apps + Docker; managed Postgres with pgvector; Redis required.

## Frontend (ElevenLabs-inspired)

Light monochrome product UI (not dark): white canvas, black primary CTAs, soft gray panels, generous space.
Typography: **Syne** (display) + **DM Sans** (body). Brand accent green `#1a6b52` sparingly.
Public surfaces: `/`, `/docs`, `/playground`, `/coverage`. Console: `/dashboard`, `/language`, `/developers`, `/enterprise`, `/gateway`, `/identity`, `/translate`, `/keys`, `/usage`.

## Phase 1 runtime shape (shipped)

- Session routes (`/v1/api-keys`, `/v1/usage/summary`, console translate): Clerk Bearer JWT → identity sync → org/workspace.
- Product route (`POST /v1/translate`): API key **or** Clerk session.
- Without Clerk/Google keys: `/setup` page; API returns `auth_not_configured` / `provider_not_configured` — not fake data.
- Tests: API + SDK suites green with DB + fixture provider; live Google test gated on `TRANSLATE_LIVE=1`.
- Audit (`audit_events`): `api_key.created` / `api_key.revoked` / `translate.completed` / daily `session.sign_in`. Console `/audit` for owners/admins.
- SDK: workspace package `@lugemi/sdk` (`Lugemi` client).
- Billing: org entitlements (`free` 50k chars / `pro` 1M). Stripe Checkout + Customer Portal + webhook. Translate returns `402 quota_exceeded` when over quota. Console `/billing`.
- Marketplace (VL-090–092): Pro orgs publish frozen `glossary` / `prompt` / `dataset` (TM) listings; optional `priceCents` with Stripe Connect destination charges + platform fee (`/marketplace`, ADR-0031–0033).
- Coverage (VL-100): golden EN→sw/yo/am eval harness + public `GET /v1/coverage` and `/coverage` (ADR-0034); reference metrics only — no leadership claims.
- Dataset program (VL-101): licensed corpus intake with consent/license/PII metadata + versioned local blobs (`/datasets`, ADR-0035); Label Studio stays external.
- Locale packs (VL-102): curated date/number/currency/honorifics/do-not-translate notes on `locale_packs`; public `/v1/locales` + `/locales` (ADR-0036).
- Vertical glossaries (VL-103): platform EN→sw starter packs (public-sector/healthcare/banking); Pro install copies into workspace glossary (`/glossary`, ADR-0037).
- Fine-tunes (VL-104): coverage candidates → Pro jobs + thin `model_registry`; gateway prefers ready `finetune` artifacts (`phrase_map` / `http_endpoint`) with vendor fallback (`/finetunes`, ADR-0038). GPU launch stays manual/Modal-gated.
- Model registry (VL-110): extended `model_registry` seeds bought providers per feature; public `/v1/models/live` + `/models`; optional W&B `externalUrl` (ADR-0039). Not MLflow.
- Training jobs (VL-111): `/v1/training-jobs` launchers (manual/Modal/Vertex/fixture); callback token for rented GPUs; optional dataset link; no fake GPU success (ADR-0040).
- Foundation models (VL-112): **deferred** — no named FM program without research org/capital; keep vendors + narrow fine-tunes (ADR-0041).
- Voice cloning (VL-064): ElevenLabs Instant Voice Cloning with consent attestation, abuse review, required watermark header; speak via `clone:{id}` (ADR-0042).
- Voice Studio (VL-120): `/audio` African studio UX — language presets, clone lifecycle UI, Clerk-first TTS; vendors only (ADR-0044).
- Own TTS (VL-121): `own:*` voices via `OWN_TTS_URL` rented endpoint (or fixture); OpenAI remains stock default (ADR-0045).
- Cloud Platform Foundation (VL-125): library Phase 1 mapped onto org/workspace/Clerk/Stripe/residency — not a control plane. Workspaces API + `X-Lugemi-Workspace-Id`, thin feature flags, `/dashboard` + `GET /v1/cloud/overview`. See [`docs/CLOUD_PLATFORM_FOUNDATION.md`](docs/CLOUD_PLATFORM_FOUNDATION.md) + ADR-0046. No AZs / service discovery.
- Identity Cloud (VL-126): library Phase 2 mapped — Clerk human IdP; Lugemi RBAC membership writes + Clerk role sync; API keys as machine identity (`lastUsedAt`); `/identity` + `GET /v1/identity/overview`. See [`docs/IDENTITY_CLOUD.md`](docs/IDENTITY_CLOUD.md) + ADR-0047. No first-party SAML/SCIM/ABAC/Teams.
- Developer Cloud (VL-127): library Phase 3 mapped — `/developers` hub, soft `lg_test_` keys (same cluster), `@lugemi/cli`, playground detect/languages, `GET /v1/developer/*`. See [`docs/DEVELOPER_CLOUD.md`](docs/DEVELOPER_CLOUD.md) + ADR-0048. No OAuth AS / sandbox island.
- Enterprise Cloud (VL-128): library Phase 4 mapped — `/enterprise` + derived policies from governance/admin/residency/billing/RBAC. See [`docs/ENTERPRISE_CLOUD.md`](docs/ENTERPRISE_CLOUD.md) + ADR-0049. No policy engine / Trust Center product.
- AI Gateway Cloud (VL-129): library Phase 5 mapped — thin gateway hub + optional OpenRouter chat fallback. See [`docs/AI_GATEWAY_CLOUD.md`](docs/AI_GATEWAY_CLOUD.md) + ADR-0050. **Closes Volume 1 Part A.**
- Language Cloud volume complete through Production Audit (VL-130–147). See LANGUAGE_CLOUD + `docs/language-cloud-audit/` and ADR-0051–0068. Fly remains default PaaS. Competitor-parity claims rejected.
- Speech Cloud Foundation shipped (VL-150 / Phase 16). See SPEECH_CLOUD + ADR-0069. Extends audio modules; does not regenerate Language Cloud.
- Speech Recognition Engine shipped (VL-151 / Phase 17). See SPEECH_RECOGNITION + ADR-0070. Segment SSE; live-mic WS deferred.
- Speaker Intelligence partial (VL-152 / Phase 18). See SPEAKER_INTELLIGENCE + ADR-0071. Local fingerprints + gap diarization.
- Accent Intelligence partial (VL-153 / Phase 19). See ACCENT_INTELLIGENCE + ADR-0072. Cue façade; acoustic models deferred.
- Emotion Intelligence partial (VL-154 / Phase 20). See EMOTION_INTELLIGENCE + ADR-0073. Cue + soft audio proxies; SER deferred.
- Audio Intelligence partial (VL-155 / Phase 21). See AUDIO_INTELLIGENCE + ADR-0074. PCM heuristics; echo AEC deferred.
- Pronunciation Intelligence partial (VL-156 / Phase 22). See PRONUNCIATION_INTELLIGENCE + ADR-0075. Alignment + heuristics; forced alignment deferred.
- Wake Word Engine partial (VL-157 / Phase 23). See WAKE_WORD + ADR-0076. Transcript spotting; on-device DNN deferred.
- Call Intelligence partial (VL-158 / Phase 24). See CALL_INTELLIGENCE + ADR-0077. Heuristic analytics; Voice FAQ remains separate.
- Speech Analytics partial (VL-159 / Phase 25). See SPEECH_ANALYTICS + ADR-0078. Usage/audit aggregates; WER lab deferred. Language Analytics separate.
- Speech Cloud volume complete through Production Audit (VL-150–160). See SPEECH_CLOUD + `docs/speech-cloud-audit/` and ADR-0069–0079. Competitor-parity claims rejected.
- **Lugemi Cloud Blueprint (12 layers)** accepted (ADR-0080 / `docs/CLOUD_BLUEPRINT.md`). Future clouds map Foundation → Production Audit without regenerating Identity/Gateway/Billing.
- Voice Cloud Foundation shipped (VL-170 / Phase 27). See VOICE_CLOUD + ADR-0081. Extends TTS/clones/studio; does not regenerate Speech Cloud.
- Neural Text-to-Speech shipped (VL-171 / Phase 28). See NEURAL_TTS + ADR-0082. Batch + chunk SSE; children voices deferred.
- Voice Cloning Platform shipped (VL-172 / Phase 29). See VOICE_CLONING + ADR-0083. Extends VL-064 consent/review/watermark with ownership/licensing/permissions.
- Emotion Voice Engine partial (VL-173 / Phase 30). See EMOTION_VOICE + ADR-0084. Soft prosody + clone style settings; distinct from VL-154 detection.
- Voice Studio shipped (VL-174 / Phase 31). See VOICE_STUDIO + ADR-0085. SSML lite + linear timeline + pronunciation lexicon over Neural TTS; not a nonlinear DAW.
- Voice Enhancement Platform partial (VL-175 / Phase 32). See VOICE_ENHANCEMENT + ADR-0086. Profile pipelines over VL-155; echo AEC / spectral ML deferred.
- Voice Biometrics partial (VL-176 / Phase 33). See VOICE_BIOMETRICS + ADR-0087. Encrypted templates + deletion + heuristic anti-spoof/liveness over VL-152; not NIST/PAD certified.
- Voice Marketplace partial (VL-177 / Phase 34). See VOICE_MARKETPLACE + ADR-0088. Distinct from localization Marketplace; celebrity without rights forbidden.
- Voice Analytics partial (VL-178 / Phase 35). See VOICE_ANALYTICS + ADR-0089. Distinct from Speech Analytics; BI dashboard deferred.
- Voice Cloud volume complete through Production Audit (VL-170–179). See VOICE_CLOUD + `docs/voice-cloud-audit/` and ADR-0081–0090. Competitor-parity claims rejected.
- Intelligence Cloud volume complete through Production Audit (VL-180–192). See INTELLIGENCE_CLOUD + `docs/intelligence-cloud-audit/` and ADR-0091–0103. Hub over LLM gateway + embeddings + RAG; custom AI kernel / Intelligence Graph OS rejected.
- Knowledge Cloud volume complete through Production Audit (VL-193–203). See KNOWLEDGE_CLOUD + `docs/knowledge-cloud-audit/` and ADR-0104–0114. Hub over VL-062 RAG + Intelligence; enterprise knowledge OS rejected in that volume.
- Inference Cloud volume complete through Production Audit (VL-204–213). See INFERENCE_CLOUD + `docs/inference-cloud-audit/` and ADR-0115–0124. Hub over AI Gateway + sandbox GPU/serving/router/stream/batch/cache/cost/analytics; GPU hyperscaler rejected in that volume. Spend-safety: hard GPU ceilings + Cost Optimization enforce.
- AI Kernel Foundation shipped (VL-214 / Phase 81). See AI_KERNEL + ADR-0125. Internal runtime hub (not customer product); not Linux/VAIOS rewrite; Agent/Workflow/Plugin must sandbox; Policy must hard-gate (VL-219–222).
- GPU Platform partial (VL-205 / Phase 72). See GPU_PLATFORM + ADR-0116. Sandbox logical allocations with hard instance/spend ceilings; no cloud GPU APIs; MIG/distributed deferred.
- Enterprise Knowledge Base partial (VL-194 / Phase 61). See ENTERPRISE_KNOWLEDGE_BASE + ADR-0105. Extends VL-062 with collections/tags/content kinds + MD/HTML; org/workspace-scoped get/remove hardened; Confluence/media/approval deferred.
- Enterprise Search partial (VL-195 / Phase 62). See ENTERPRISE_SEARCH + ADR-0106. Keyword + semantic + light hybrid RRF over VL-062/Vector Cloud; Elastic/BM25/image/voice deferred.
- Ontology Platform partial (VL-196 / Phase 63). See ONTOLOGY_PLATFORM + ADR-0107. Concepts/hierarchies/synonyms over VL-184 KG; OWL/Protegé/certified vertical packs deferred.
- Taxonomy Platform partial (VL-197 / Phase 64). See TAXONOMY_PLATFORM + ADR-0108. Category/tag trees + document assign; ML auto-classification deferred.
- Embedding Cloud partial (VL-181 / Phase 48). See EMBEDDING_CLOUD + ADR-0092. Text/document/code over VL-063; multimodal deferred.
