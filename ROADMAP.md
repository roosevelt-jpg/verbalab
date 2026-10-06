# Lugemi AI — Consolidated Roadmap

**Status:** living document. Update this file and `PROGRESS.md` every session.  
**Sources:** `LUGEMI AI ENGINEERING LIBRARY V1.md` (v1) and `LUGEMI ENGINEERING LIBRARY v2.md` (v2).  
**Rule:** one executable phase in flight at a time. A phase is Done only when it is real, integrated, and tested — not merely present.

---

## How to use this file

1. Read `PROGRESS.md` and `ARCHITECTURE.md` at the start of every session.
2. Pick the next **Not Started** executable phase in order, unless you explicitly override the order here.
3. Paste that phase’s section into the per-phase prompt (see the kickoff pack). Do **not** paste an entire library volume.
4. When the phase is actually done, mark it in `PROGRESS.md` and note any shortcut, vendor, or follow-up here.

This roadmap is a **backlog and vision**, not a one-shot build script. v1 and v2 together describe a multi-year, multi-team AI infrastructure company. A solo or small team that tries to implement them in library order will fake completeness.

---

## Merge verdict: v2 supersedes v1

| Topic | Verdict |
| --- | --- |
| Canonical inventory | **v2.** It is the later, expanded constitution (Phases −5 through 260, plus 261–300 “AI Internet”, plus a sketched v6.0 “Global OS”). |
| v1 role | Compressed **product-shaped** cut of the same company (Phases −2 through 50). Useful as a *product* checklist; incomplete as an *architecture* inventory. |
| Where they overlap | Identity, workspace, AI gateway, language registry, translation, speech, voice, OCR, embeddings, knowledge, developer platform, billing, metering, security, marketplace, African languages, agents, governance. **Use v2 names and scope; keep v1’s earlier, more honest sequencing for MVP** (gateway → one vertical → billing). |
| Where v2 supersedes v1 | v2 splits each v1 “Cloud” into a foundation + many engines + a production audit. Speech, Voice, Vision, Intelligence, Knowledge, Inference, Kernel, Foundation Models, Fabric, Ecosystem, African Intelligence, Research, MLOps, Trust, Platform Engineering, Control/Data Plane, VAIOS, corporate OS, global standards, AI economy, “digital civilization”. |
| Where v1 is still better | v1 puts **billing, metering, developer platform, and a unified console** in the first 30 phases. v2 buries commercial reality under hundreds of internal platforms. **We restore v1’s commercial ordering** inside milestones M2–M3. |
| Where both are unrealistic | Training foundation models, GPU clouds, AI operating systems, global standards bodies, AI economies, national platforms, “AI Internet”. Treat as **vision**, not a near-term backlog. v2’s own closing note agrees: stop expanding the vision and implement one bounded context at a time. |
| Repo strategy | v2’s closing “six repositories” note is a **later split**. Start with **one monorepo**. Split only when build times, access control, or release cadence actually hurt. |

### v1 → v2 mapping (compressed)

| v1 | v2 (superseding) | Our executable home |
| --- | --- | --- |
| −2 Company strategy | −5 Vision, −4 Market, −3 AI strategy | Absorbed into this file + `ARCHITECTURE.md` |
| −1 Enterprise blueprint | −2 Business architecture, −1 Product blueprint | **`docs/ENTERPRISE_PRODUCT_BLUEPRINT.md`** + this file’s MVP runtime shape |
| 0 Engineering foundation | 0 Engineering OS + 1 Cloud foundation | **VL-001, VL-002** |
| 1 Identity | 2 Identity Cloud (+ 166 federation) | **VL-010–VL-013** |
| 2 Workspace | 1 Cloud foundation + 4 Enterprise foundation | **VL-012** |
| 3 AI Gateway | 5 AI Gateway (+ 74 AI Router, 71–80 Inference) | **VL-021** |
| 4 Language registry | 7 Language Registry (+ 128 African registry) | **VL-020** |
| 5 Translation Cloud | 6–15 Language Cloud | **VL-022–VL-024, VL-040, VL-050–VL-054** |
| 6 Speech Cloud | 16–26 Speech Cloud | **VL-150+**; **VL-151** recognition; **VL-041/042** vendor STT/TTS |
| 7 Voice Cloud | 27–36 Voice Cloud | **VL-170+**; foundation hub; **VL-042/064/120/121** engines |
| 8 OCR Cloud | 37–46 Vision Cloud | **VL-043** (vendor) |
| 9 Live Interpreter | (no dedicated volume; compose STT+MT+TTS) | **VL-061** |
| 10 AI Chat | Intelligence Cloud 47–59 | **VL-060** |
| 11 Voice AI / agents | Voice + Agent runtime 86, 84 | **VL-084** |
| 12–13 Datasets / annotation | 119, 149, 140 | M10 dataset program; do not build Labelbox |
| 14–17 Model registry / deploy / train / eval | 102–104, 148–158 | **VL-110–VL-111** (buy tools) |
| 18 Research Lab | 138–147 | Vision / later |
| 19 Embeddings | 48–49, 97 | **VL-063** |
| 20 Knowledge | 60–70 | **VL-062** |
| 21 Developer platform | 3 Developer Cloud | **VL-030, VL-033** |
| 22 API Marketplace | 116–126 Ecosystem | **VL-090–VL-092** |
| 23–24 Billing + metering | (scattered; v1 is clearer) | **VL-024, VL-031** |
| 25 Analytics | many `* Analytics` phases | **VL-085** |
| 26 Notifications | — | **VL-080** |
| 27–28 Connectors / workflows | 87, 123, 122 | **VL-082, VL-083** |
| 29–30 Admin / customer portal | 4, 181–182 | **VL-081** |
| 31–33 Security / compliance / audit | 159–168 Trust Cloud | **VL-072, VL-073, VL-032** |
| 34–40 Multi-region, K8s, observability, AIOps, DR, hardening | 169–200, 34–40 of v1 | **VL-070, VL-074, VL-075** |
| 41 Marketplace | 116–126 | **VL-090+** |
| 42–43 Language intelligence / African foundation | 6–15, 127–137 | **VL-050+, VL-100–VL-104** |
| 44 Knowledge graph | 51, 130 | Defer; start with Postgres + pgvector |
| 45–48 Agents / prompts / safety / governance | 55, 86, 160–161 | **VL-086**, Trust later |
| 49 Collaboration | — | Defer |
| 50 Unified cloud platform | Control/Data plane, VAIOS | Emergent result of M0–M8, not a phase |

---

## Working rules (non-negotiable)

1. **One phase in flight.** Do not “quickly add” the next cloud.
2. **Extend, don’t regenerate.** No greenfield rewrites of prior phases unless a migration is called out first.
3. **No fake completeness.** If a real provider key, DNS, or Stripe account is missing, stop and list the blocker.
4. **Tests are the Done gate.** Unit/integration for APIs; at least one end-to-end path for UI.
5. **Buy models first.** Lugemi’s early product is **orchestration, tenancy, eval, African-language coverage, and UX** — not a new foundation model.
6. **Override library order freely.** The library assumes unlimited headcount. This file is the real order.

---

## Milestone map

| Milestone | Intent | Outcome a customer can touch |
| --- | --- | --- |
| **M0 Foundation** | Repo, standards, local platform | Clone, `pnpm i`, `pnpm test`, web + API health |
| **M1 Identity + Workspace** | Who you are, who pays, who can call APIs | Sign-in, org, workspace, API key |
| **M2 Translation wedge** | One real vertical, provider-backed | Paste text → translation; usage counted |
| **M3 Make it sellable** | Docs, SDK, Stripe | A developer can pay and integrate |
| **M4 Media verticals** | STT / TTS / OCR / documents via vendors | Same tenancy, more APIs |
| **M5 Language depth** | Glossary, TM, localization — the wedge vs raw Google | Better enterprise translation |
| **M6 Adjacent products** | Chat, interpreter, RAG | Second and third SKUs |
| **M7 Hardening** | Observability, security, deploy | Something you can actually host |
| **M8 Platform products** | Admin, connectors, workflows, agents | Enterprise packaging |
| **M9 Ecosystem** | Marketplace | Only after M3–M7 are real |
| **M10 African differentiation** | Coverage, data, eval, optional fine-tunes | Reason to exist vs DeepL/Google |
| **M11 Own models** | Registry + rented GPUs; FMs only if funded | Hire/vendor, do not solo-build |
| **Vision** | Kernel, fabric, VAIOS, economy, civilization, AI Internet | Not scheduled |

---

## Buy vs build register (read this before any “engine” phase)

| Capability | Decision | Default vendor / tool | Build later only if… |
| --- | --- | --- | --- |
| Auth, MFA, OAuth, passkeys | **Buy** | Clerk (library default) or Better Auth + hosted OAuth | You need on-prem IdP with no SaaS |
| SAML / SCIM / enterprise SSO | **Buy** | Clerk Enterprise or WorkOS | Enterprise contracts demand it |
| Translation models | **Buy** | Google Cloud Translation or Azure Translator (African coverage); DeepL as a high-quality European route | You have labeled data + eval that vendors fail |
| LLM routing | **Buy models, build a thin gateway** | OpenAI, Anthropic, plus one cheap/fast (Groq/OpenRouter) | Never build the model |
| STT | **Buy** | Deepgram, AssemblyAI, Google STT, or OpenAI Whisper API | Unique African-language ASR with data |
| TTS / cloning | **Buy** | Azure TTS, ElevenLabs, Google TTS | Branded voice with consent pipeline |
| OCR / documents | **Buy** | Google Document AI, Azure DI, or AWS Textract | Niche document types vendors miss |
| Embeddings / vector | **Buy + Postgres** | OpenAI/Gemini embeddings + pgvector | Scale forces a dedicated vector DB |
| Payments | **Buy** | Stripe Billing (subscriptions + metered) | Never build a card vault |
| Email | **Buy** | Resend or Postmark | — |
| Observability | **Buy** | Sentry + structured logs; Axiom/Better Stack optional | K8s-scale metrics later |
| Object storage | **Buy** | S3 / R2 / GCS | — |
| Training / GPUs | **Buy** | Modal, Replicate, Vertex, Together, Fireworks | You have a research org |
| Foundation models (Atlas, Baobab, Echo, …) | **Do not build** | Licensed or open weights | Series B+ ML org |
| Annotation platform | **Buy** | Label Studio Cloud, Prodigy, or a vendor | Internal data ops at scale |
| Knowledge graph | **Defer** | Postgres first | Graph queries are a proven bottleneck |
| Kubernetes / multi-region / service mesh | **Defer** | One region, Docker or a PaaS | You have an SRE and real load |
| Voice biometrics, wake word, on-device | **Defer / buy** | Specialist vendors | Regulated product demand |

---

## Executable phases

Complexity: **S** = days, **M** = ~1–2 weeks, **L** = ~3–6 weeks, **XL** = a quarter or a dedicated team/vendor. Estimates assume 1–3 engineers.

Dependencies are **hard**: do not start a phase until listed predecessors are Done.

---

### M0 — Foundation

#### VL-000 — Living constitution

- **Goal:** Single ordered backlog, architecture, and progress tracker that survive context resets. (This kickoff.)
- **Why it matters:** The libraries are ~300 phases. Without a living gate, agents regenerate universes and skip tests.
- **Complexity:** S
- **Depends on:** nothing
- **Buy vs build:** n/a (docs)
- **Sources:** kickoff pack; v1 −2/−1; v2 −5…−1
- **Done means:** `ROADMAP.md`, `PROGRESS.md`, `ARCHITECTURE.md`, `PHASE_0_1.md` exist and match each other.

#### VL-001 — Engineering standards (thin)

- **Goal:** Engineering Operating System docs: monorepo/repo/folder/coding/DB/API/UI/a11y/AI/cloud/testing/git/docs/security/observability/performance; ADR + RFC/PRD/runbook templates. Thin daily sheet remains `docs/ENGINEERING.md`; full OS is `docs/ENGINEERING_OS.md`.
- **Why it matters:** Stops later phases from inventing a second API style or empty “standard” folders.
- **Complexity:** S
- **Depends on:** VL-000
- **Buy vs build:** n/a
- **Sources:** v2 Phase 0 (subset); v1 Phase 0; v2 211–220 (defer bureaucracy platforms)
- **Out of scope:** Internal developer portal product, golden-path factory SaaS, regenerating the monorepo.

#### VL-002 — Monorepo skeleton

- **Goal:** pnpm + Turborepo production monorepo with `apps/web`, `apps/api`, `packages/sdk`, shared TS config, Compose Postgres/Redis, Fly deploy, lint/typecheck/test/e2e in CI, health endpoints. **No Kubernetes, no Terraform, no fake microservices, no regenerate.**
- **Why it matters:** Every later phase extends this repo instead of starting over.
- **Complexity:** M
- **Depends on:** VL-001
- **Buy vs build:** GitHub Actions (buy/host), local Postgres (Compose), Fly.io PaaS
- **Sources:** v1 Phase 0 (stack list — **cut hard**; see `ARCHITECTURE.md`); v2 Phase 0 “then create the production monorepo”
- **Done means:** `pnpm test` and CI pass. Web loads. API `/health` is 200. This repository **is** that monorepo.

---

### M1 — Identity + Workspace

#### VL-010 — Authentication

- **Goal:** Hosted sign-up / sign-in (email + Google OAuth). Session on the web; JWT or session-backed calls to the API.
- **Why it matters:** There is no enterprise cloud without a user.
- **Complexity:** M
- **Depends on:** VL-002
- **Buy vs build:** **Buy Clerk** (v1 default) unless you explicitly choose Better Auth.
- **Sources:** v1 Phase 1; v2 Phase 2 (subset: drop SAML/SCIM/passkeys/ABAC until demanded)
- **Out of scope:** MFA policy engine, passwordless as a science project, custom JWT crypto.

#### VL-011 — Organizations, members, basic RBAC

- **Goal:** Org as tenant. Roles: `owner`, `admin`, `member`. Invite by email (provider-hosted).
- **Why it matters:** B2B billing and API keys hang off the org, not the user.
- **Complexity:** M
- **Depends on:** VL-010
- **Buy vs build:** Clerk Organizations if Clerk is the IdP
- **Sources:** v1 Phase 1; v2 Phases 1–2, 4
- **Out of scope:** ABAC, custom permission graphs, SCIM.

#### VL-012 — Workspaces

- **Goal:** Org workspaces with name + default language pair; multi-workspace CRUD; session override via `X-Lugemi-Workspace-Id`. Workspace-scoped API keys already exist.
- **Why it matters:** Matches how translation tools are actually used (projects/workspaces), without building a CMS or a separate Project tier.
- **Complexity:** S
- **Depends on:** VL-011
- **Sources:** v1 Phase 2; v2 Phases 1, 4; library Cloud Foundation “Projects”
- **Out of scope:** Per-workspace billing profiles, knowledge bases, branding studios, GCP-style Projects.

#### VL-013 — API keys

- **Goal:** Create/revoke hashed API keys (`lg_live_...`). Authenticate `Authorization: Bearer` on `/v1/*`. Show secret **once**.
- **Why it matters:** The product is an API company; a dashboard-only demo is not the product.
- **Complexity:** S
- **Depends on:** VL-012
- **Sources:** v1 Phase 1; v2 Phases 2–3
- **Out of scope:** Service-account federation, mTLS, key rotation ceremonies.

---

### M2 — AI Gateway + Translation (first real product)

#### VL-020 — Language registry (seed, not a linguistics OS)

- **Goal:** Table of languages: BCP-47 code, English name, native name, script, RTL flag, `tier` (vendor-supported vs strategic-African). Seed ISO 639-1 plus a curated African set (e.g. sw, yo, ha, am, zu, ig, so, rw, sn, xh, nso, tn, st, af, ar).
- **Why it matters:** The company story is language coverage. The registry is how we refuse unsupported pairs instead of silently calling a vendor.
- **Complexity:** S
- **Depends on:** VL-002 (can land after VL-013; needs DB only)
- **Sources:** v1 Phase 4; v2 Phase 7; v2 Phase 128 (African — seed only)
- **Out of scope:** Unlimited dialects, morphology rules, phonetics, grammar engines.

#### VL-021 — AI Gateway (thin)

- **Goal:** One internal module: provider adapters, timeout, one retry, error mapping, per-request log (provider, model, tokens/chars, latency, cost estimate). Start with **one translation provider** and optionally one LLM provider. No geo-routing, no multi-cloud mesh.
- **Why it matters:** Every later vertical should call *this*, not random SDKs from controllers.
- **Complexity:** M
- **Depends on:** VL-013 (so requests are tenant-attributed)
- **Buy vs build:** Build the *gateway*; buy the *models*.
- **Sources:** v1 Phase 3; v2 Phase 5; v2 74/77/78 (defer cache/cost-optimizer platforms)
- **Out of scope:** OpenRouter clone, GraphQL, custom model runtime.

#### VL-022 — Translation API (text)

- **Goal:** `POST /v1/translate` with `{ text, source, target, glossaryId? }`. Synchronous text only. Persist request/response metadata (not necessarily full text, unless needed for TM later — default: store text with retention flag).
- **Why it matters:** This is the first thing a customer pays for.
- **Complexity:** M
- **Depends on:** VL-020, VL-021
- **Buy vs build:** Google Cloud Translation **or** Azure Translator (pick one in Phase 1 and commit). DeepL as a second adapter only after the first is production-tested.
- **Sources:** v1 Phase 5 (text subset); v2 Phase 8 (text subset)
- **Out of scope:** PDF/Office, websites, WhatsApp, meetings, streaming.

#### VL-023 — Console: translate UI

- **Goal:** Logged-in page: source/target dropdowns from registry, textarea, result, character count. Uses session, not a pasted API key.
- **Why it matters:** You cannot dogfood an API you cannot see.
- **Complexity:** S
- **Depends on:** VL-010, VL-022
- **Sources:** v1 Phase 30/50 (tiny slice); v2 Phase 1 Cloud Console (tiny slice)

#### VL-024 — Usage metering (minimal)

- **Goal:** Append-only `usage_events` (org, workspace, feature, units, unit type `characters|requests`, provider, at). Dashboard shows month-to-date totals. Gateway writes the event in the same request path (transaction or outbox later).
- **Why it matters:** Without metering you cannot price or debug cost. v1 was right to put this early.
- **Complexity:** S
- **Depends on:** VL-022
- **Sources:** v1 Phase 24; v1 Phase 23 (billing consumes this later)
- **Out of scope:** ClickHouse, GPU-hour accounting, real-time billing webhooks.

---

### M3 — Make it sellable

#### VL-030 — Developer portal slice

- **Goal:** OpenAPI for `/v1/translate` (and keys). In-console API playground. Public docs page for that one endpoint. `.env` example for the SDK.
- **Why it matters:** Developers do not buy dashboards; they buy an integrate-able API.
- **Complexity:** M
- **Depends on:** VL-013, VL-022
- **Sources:** v1 Phase 21; v2 Phase 3
- **Out of scope:** Full CLI, sandbox vs production planes, SDK codegen factory.

#### VL-031 — Billing (Stripe)

- **Goal:** Free tier + one paid plan. Stripe Customer on the org. Metered item for translation characters **or** a simple included quota + overage. Customer portal for payment method. Webhook → local entitlement (`plan`, `characterQuota`).
- **Why it matters:** Otherwise Lugemi is a demo.
- **Complexity:** L
- **Depends on:** VL-024, VL-011
- **Buy vs build:** **Stripe**. Never store cards.
- **Sources:** v1 Phase 23
- **Blockers:** Stripe account, webhook endpoint (Stripe CLI locally, then a public URL).
- **Out of scope:** Usage wallets, enterprise MSAs, tax engines beyond Stripe Tax if needed.

#### VL-032 — Audit log

- **Goal:** Record sign-in, key create/revoke, translate calls (who, which key prefix, IP, route). Query in console for org admins.
- **Why it matters:** First enterprise checkbox; also your own incident trail.
- **Complexity:** S
- **Depends on:** VL-010, VL-013
- **Sources:** v1 Phases 1, 33; v2 Trust subset

#### VL-033 — TypeScript SDK (thin)

- **Goal:** Published-as-workspace package: `new Lugemi({ apiKey }).translate(...)`. Types match OpenAPI. Tests against a mock server or local API.
- **Why it matters:** Copy-paste `fetch` is not a developer platform.
- **Complexity:** S
- **Depends on:** VL-030
- **Sources:** v1 Phase 21; v2 sdk repo note (one language only)

---

### M4 — Media and documents (all vendor-backed)

#### VL-040 — Document translation

- **Goal:** Upload DOCX/PDF (size-capped). Extract text, chunk, call VL-022, re-pack a simple output (translated DOCX or text). Job status API.
- **Why it matters:** Real translation revenue is documents, not 140-character boxes.
- **Complexity:** M
- **Depends on:** VL-022, VL-044 (can be designed together; jobs first if needed)
- **Buy vs build:** Buy extraction (e.g. existing parsers); do not build a PDF renderer.
- **Sources:** v1 Phase 5; v2 Phase 8 document bullets

#### VL-041 — Speech-to-text

- **Goal:** `POST /v1/audio/transcriptions` (file + language hint). Vendor STT. Usage in minutes.
- **Why it matters:** Speech is a second SKU on the same tenant/gateway.
- **Complexity:** M
- **Depends on:** VL-021, VL-024
- **Buy vs build:** Deepgram or OpenAI Whisper API
- **Sources:** v1 Phase 6; v2 Phases 16–17
- **Out of scope:** Speaker diarization platform, emotion AI, wake word, call intelligence.

#### VL-042 — Text-to-speech

- **Goal:** `POST /v1/audio/speech` text + voice id + language. Return audio. Catalog of vendor voices.
- **Why it matters:** Interpreter and agents need it; also a clean demo.
- **Complexity:** M
- **Depends on:** VL-021, VL-024
- **Buy vs build:** Azure TTS or ElevenLabs
- **Sources:** v1 Phase 7; v2 Phases 27–28
- **Out of scope:** Voice cloning studio, emotion TTS engine, voice marketplace.

#### VL-043 — OCR

- **Goal:** Image/PDF → text (and optional translate). Vendor Document AI.
- **Why it matters:** African-language documents are often scans, not Unicode.
- **Complexity:** M
- **Depends on:** VL-021, VL-022
- **Buy vs build:** Google Document AI or Azure DI
- **Sources:** v1 Phase 8; v2 Phases 37–38
- **Out of scope:** Invoice graph engines, ID-document forensics, visual search.

#### VL-044 — Jobs, webhooks, batch

- **Goal:** `jobs` table, status polling, signed outbound webhooks, Redis/BullMQ **or** Postgres-backed queue if Redis is not in yet (prefer adding Redis here — first justified use).
- **Why it matters:** Documents and audio cannot live on the HTTP request timeout.
- **Complexity:** M
- **Depends on:** VL-013
- **Sources:** v2 Phases 76, 107 (event fabric — **do not build a fabric**; build a queue)

---

### M5 — Language depth (differentiation without training)

#### VL-050 — Glossary / terminology

- **Goal:** Per-workspace term lists (source term, target, language pair, case rules). Applied in VL-022 (provider glossary API if available, else constrained decoding / post-replace with tests).
- **Why it matters:** This is how you beat a raw Google widget in banks and government.
- **Complexity:** M
- **Depends on:** VL-022, VL-012
- **Sources:** v1 Phase 5; v2 Phase 8 terminology; v2 Phase 9 subset

#### VL-051 — Translation memory

- **Goal:** Store approved segments; exact-match reuse; simple fuzzy later (pg_trgm). Bypass vendor on exact hit.
- **Why it matters:** Cost + consistency.
- **Complexity:** M
- **Depends on:** VL-022, VL-024
- **Sources:** v2 Phase 13

#### VL-052 — Quality estimation (lightweight)

- **Goal:** Store provider scores if any; optional second-pass LLM review flag; human accept/reject. No “quality engine company”.
- **Why it matters:** Enterprise buyers ask “how do I know it’s good?”
- **Complexity:** S
- **Depends on:** VL-022
- **Sources:** v2 Phase 8 quality engine (subset)

#### VL-053 — Localization files

- **Goal:** Translate JSON/YAML i18n files with key preservation, ICU plural passthrough where feasible.
- **Why it matters:** Software localization is a wedge adjacent to document MT.
- **Complexity:** M
- **Depends on:** VL-022, VL-050
- **Sources:** v2 Phase 9
- **Out of scope:** Full TMS competitor to Phrase/Lokalise.

#### VL-054 — Language detection

- **Goal:** Detect source language when `source=auto`. Prefer vendor detect; fall back to a small library for Latin-script only if needed.
- **Why it matters:** UX for VL-023 and chat.
- **Complexity:** S
- **Depends on:** VL-020, VL-021
- **Sources:** v2 Phase 6 product list

---

### M6 — Adjacent products

#### VL-060 — AI Chat (workspace, gateway-backed)

- **Goal:** One chat UI + `POST /v1/chat/completions`-style endpoint via the gateway. System prompt: language-intelligence assistant. Optional translate-then-answer.
- **Why it matters:** Chat is how people discover the rest of the platform — but it is **not** the company.
- **Complexity:** M
- **Depends on:** VL-021, VL-010
- **Sources:** v1 Phase 10; v2 Intelligence Cloud (subset)
- **Out of scope:** Custom reasoner, memory cloud, agent OS.

#### VL-061 — Live interpreter (compose, don’t invent)

- **Goal:** Pipeline: audio in → STT → MT → TTS → audio out. Sequential first; streaming only if the STT vendor supports it cleanly.
- **Why it matters:** High-demo product; proves clouds compose.
- **Complexity:** L
- **Depends on:** VL-041, VL-022, VL-042
- **Sources:** v1 Phase 9
- **Buy vs build:** Buy all three models; build the session API.

#### VL-062 — Knowledge + RAG

- **Goal:** Upload a few PDFs/texts per workspace; chunk; embed; retrieve; answer with citations. pgvector.
- **Why it matters:** Enterprise “talk to our documents in any language”.
- **Complexity:** L
- **Depends on:** VL-063, VL-012, VL-060
- **Sources:** v1 Phase 20; v2 Phases 60, 61, 65
- **Out of scope:** Ontology platform, taxonomy platform, knowledge graphs.

#### VL-063 — Embeddings API

- **Goal:** Gateway adapter to one embedding model; used by RAG; optional public `POST /v1/embeddings`.
- **Why it matters:** Shared primitive; do not let RAG embed ad hoc.
- **Complexity:** S
- **Depends on:** VL-021
- **Sources:** v1 Phase 19; v2 Phases 48–49, 97

#### VL-064 — Voice cloning (optional, vendor)

- **Goal:** If ever sold: ElevenLabs (or equivalent) voice clone **with explicit consent, watermarking, and abuse review**. Otherwise skip.
- **Why it matters:** Library wants a Voice Cloud; legally this is a loaded gun.
- **Complexity:** L
- **Depends on:** VL-042, VL-072
- **Buy vs build:** **Buy**. Do not train cloning models.
- **Sources:** v2 Phases 29, 31, 34
- **Gate:** Legal review. Default: **not started until asked**.

---

### M7 — Hardening

#### VL-070 — Observability

- **Goal:** Structured JSON logs, request IDs, Sentry (API + web), p95 latency on translate. No self-hosted Prometheus/Grafana until you operate K8s.
- **Why it matters:** You cannot sell SLA without seeing failures.
- **Complexity:** M
- **Depends on:** VL-002, VL-022
- **Sources:** v1 Phase 36; v2 observability standards (subset)

#### VL-071 — Rate limits and quotas

- **Goal:** Per-key and per-org limits (Redis). 429 with `Retry-After`. Enforce Stripe entitlements from VL-031.
- **Why it matters:** One customer must not bankrupt the vendor bill.
- **Complexity:** S
- **Depends on:** VL-013, VL-031 (quotas); Redis may be introduced here or in VL-044
- **Sources:** v1 Phase 3 rate limiting; v2 cost optimization (subset)

#### VL-072 — Security baseline

- **Goal:** Tenant isolation tests (org A cannot read org B). Secret scanning in CI. Security headers. Encrypted keys at rest (already hashed). Dependency audit. No “Security Cloud”.
- **Why it matters:** Language data is often confidential.
- **Complexity:** M
- **Depends on:** VL-011, VL-022
- **Sources:** v1 Phase 31, 40; v2 Trust 159–163 (subset)

#### VL-073 — Data governance

- **Goal:** Retention settings, export workspace data, delete org (cascade). DPA-ready data map in docs. Optional “do not train / do not persist source text”.
- **Why it matters:** Government and bank RFPs.
- **Complexity:** M
- **Depends on:** VL-012, VL-032
- **Sources:** v1 Phase 32; v2 Phases 163–164

#### VL-074 — Production deploy (one region)

- **Goal:** One production environment (Fly/Render/Railway/ECS — pick in the phase, don’t invent a cloud). Managed Postgres. Migrations in CI. Preview deploys optional.
- **Why it matters:** Localhost is not a cloud.
- **Complexity:** M
- **Depends on:** VL-002, VL-070
- **Buy vs build:** PaaS first. **No EKS.**
- **Sources:** v1 Phases 34–35 (reject K8s until load); v2 173–175 subset

#### VL-075 — Multi-region

- **Goal:** Only after a real residency requirement (e.g. EU). Separate deploy + data, not a global mesh.
- **Why it matters:** Residency is a sales block for some governments.
- **Complexity:** XL
- **Depends on:** VL-074, actual customer demand
- **Sources:** v1 Phase 34; v2 Control/Data plane
- **Default:** **deferred.**

---

### M8 — Platform products

#### VL-080 — Notifications

- **Goal:** Email for invites, usage-threshold alerts, job-complete. Provider: Resend.
- **Why it matters:** Async jobs and billing need it.
- **Complexity:** S
- **Depends on:** VL-010, VL-044 (jobs) or VL-031 (usage alerts)
- **Sources:** v1 Phase 26

#### VL-081 — Admin + customer portal

- **Goal:** Internal admin: find org, disable keys, see usage. Customer: plan, invoices (Stripe portal), members.
- **Why it matters:** You will otherwise SSH to production.
- **Complexity:** M
- **Depends on:** VL-031, VL-011
- **Sources:** v1 Phases 29–30; v2 Mission Control (do **not** build the sci-fi version)

#### VL-082 — Connectors

- **Goal:** One connector (Slack **or** Google Drive). Translate a message/file back into the tool.
- **Why it matters:** Distribution. Pick one; do not build a connector platform.
- **Complexity:** L
- **Depends on:** VL-022, VL-013
- **Sources:** v1 Phase 27; v2 Phase 123
- **Out of scope:** Universal connector SDK, Zapier competitor.

#### VL-083 — Workflows

- **Goal:** Simple directed steps: e.g. transcribe → translate → notify. Stored as JSON; executed by the job runner.
- **Why it matters:** Contact-center and localization pipelines.
- **Complexity:** L
- **Depends on:** VL-044, VL-022
- **Sources:** v1 Phase 28; v2 Phase 87
- **Out of scope:** Temporal competitor, visual BPMN.

#### VL-084 — Voice agents

- **Goal:** Inbound/outbound call agent: Twilio (or Telnyx) + STT + LLM + TTS. One demo flow (e.g. bilingual FAQ).
- **Why it matters:** High ARPU; also a graveyard of scope.
- **Complexity:** XL
- **Depends on:** VL-041, VL-042, VL-060, VL-074
- **Buy vs build:** Buy telephony + models.
- **Sources:** v1 Phase 11; v2 Voice + Agent runtime
- **Gate:** Only after interpreter (VL-061) is real.

#### VL-085 — Analytics

- **Goal:** Org dashboard: volume by language pair, cost, error rate. SQL on `usage_events`. No “analytics cloud”.
- **Why it matters:** Pricing and coverage decisions.
- **Complexity:** M
- **Depends on:** VL-024, VL-023
- **Sources:** v1 Phase 25; v2 Language Analytics 14

#### VL-086 — Prompt management

- **Goal:** Versioned prompts for chat/interpreter/RAG in DB, not in code. Rollback.
- **Why it matters:** You will otherwise ship prompt changes as deploys with no history.
- **Complexity:** M
- **Depends on:** VL-060
- **Sources:** v1 Phase 46; v2 Phases 55, 152
- **Out of scope:** Prompt marketplace.

---

### M9 — Ecosystem (late)

#### VL-090 — Marketplace foundation

- **Goal:** Listings table, publisher org, install into a workspace, entitlement. Start with **glossaries or voices**, not “every AI asset”.
- **Why it matters:** Network effects — but they starve if the core API is weak.
- **Complexity:** XL
- **Depends on:** VL-031, VL-072, VL-081
- **Sources:** v1 Phases 22, 41; v2 116–126
- **Gate:** Paid customers exist.

#### VL-091 — Listings expansion

- **Goal:** Additional listing types (prompts, datasets) on the same foundation.
- **Complexity:** XL
- **Depends on:** VL-090
- **Sources:** v2 117–124

#### VL-092 — Creator payouts

- **Goal:** Stripe Connect (or invoice-based) revenue share.
- **Complexity:** XL
- **Depends on:** VL-090, VL-031
- **Sources:** v2 125, 244
- **Buy vs build:** Stripe Connect

---

### M10 — African differentiation

This is the mission. It is **not** “train Baobab”. It is coverage, evaluation, data rights, and domain language.

#### VL-100 — Coverage matrix and eval harness

- **Goal:** Golden sets per language pair (start with 3 African languages × English). Automated eval vs vendor. Public-facing coverage page that is **true**.
- **Why it matters:** Without eval you cannot claim leadership and cannot know when to fine-tune.
- **Complexity:** M
- **Depends on:** VL-022
- **Sources:** v2 127–128, 141–142; v1 Phase 43
- **Buy vs build:** Build the harness; buy or license datasets where possible.

#### VL-101 — Dataset program (process + storage, not Dataset Cloud)

- **Goal:** Legal intake, consent, storage in object storage, license tags, PII handling. Partner with universities. Use Label Studio if annotating.
- **Why it matters:** Future fine-tunes are impossible without this; building a dataset *product* is optional.
- **Complexity:** L
- **Depends on:** VL-073
- **Sources:** v1 12–13; v2 119, 149, 140
- **Out of scope:** Dataset marketplace until VL-090.

#### VL-102 — Locale and cultural packs

- **Goal:** Date/number/currency, honorifics, known untranslatable entities, locale notes in the registry.
- **Why it matters:** “Translation” that ignores culture fails government and media buyers.
- **Complexity:** M
- **Depends on:** VL-020, VL-050
- **Sources:** v2 Phase 129 (subset — not a “cultural intelligence platform”)

#### VL-103 — Vertical glossaries

- **Goal:** Starter glossaries: public-sector, healthcare, banking — for 1–2 languages. Sold or bundled.
- **Why it matters:** Domain accuracy is a product.
- **Complexity:** L
- **Depends on:** VL-050, VL-101
- **Sources:** v2 131–134 (as *content*, not new clouds)

#### VL-104 — Fine-tunes for failed pairs

- **Goal:** Where VL-100 shows vendors failing, fine-tune a small open model **on rented GPUs**. Serve via the gateway as a provider option.
- **Why it matters:** This is the first honest “own model” — narrow, measured, reversible.
- **Complexity:** XL
- **Depends on:** VL-100, VL-101, VL-021, VL-111
- **Buy vs build:** Buy training infra; build data + eval + adapter
- **Sources:** v2 93 Baobab, 102–103 — **narrowed to fine-tunes, not foundation models**

---

### M11 — Own models (funding-gated)

#### VL-110 — Model registry (buy)

- **Goal:** Track which provider/model is live per feature. Use Weights & Biases or a simple `models` table. Do not build MLflow-from-scratch.
- **Complexity:** M
- **Depends on:** VL-021
- **Sources:** v1 Phase 14; v2 Phase 104

#### VL-111 — Training jobs (rented)

- **Goal:** Job API that launches a fine-tune on Modal/Vertex and records artifacts. Manual at first is acceptable.
- **Complexity:** XL
- **Depends on:** VL-110, VL-101
- **Buy vs build:** **Buy** GPU cloud
- **Sources:** v1 15–16; v2 72, 102, 150
- **Out of scope:** Internal GPU platform, Kubernetes device plugins.

#### VL-112 — Foundation model program

- **Goal:** Only with a research org and budget: named models (Atlas, Baobab, Echo, …) as **products on top of trained weights**.
- **Complexity:** XL (company-scale)
- **Depends on:** VL-104 success, hires, capital
- **Buy vs build:** **Do not start.** Use open weights + vendors.
- **Sources:** v2 91–105; v1 closing “strategic enhancement”

---

### M12 — African product depth (scheduled override)

User override (2026-09-07): build tracks 1–5 from the library ambition as **bounded** phases. One in flight.

#### VL-120 — African voice studio UX

- **Goal:** Console Voice Studio (`/audio`) over existing OpenAI TTS + ElevenLabs clones: African language presets, clone lifecycle (multi-sample, review, disable), preview playback. No model training.
- **Complexity:** M
- **Depends on:** VL-042, VL-064
- **Buy vs build:** Buy models; build studio UX
- **Sources:** v2 Voice Cloud 27–36 (UX subset)

#### VL-121 — Own TTS path (rented)

- **Goal:** Gateway TTS adapter for open-weight / rented GPU TTS selectable beside OpenAI; OpenAI remains default.
- **Complexity:** L
- **Depends on:** VL-120, VL-021
- **Buy vs build:** Buy GPU host; build adapter

#### VL-122 — Speech depth

- **Goal:** Streaming STT/TTS where vendors allow + dialect metadata for priority African languages.
- **Complexity:** L
- **Depends on:** VL-041, VL-042, VL-120
- **Buy vs build:** Buy streaming vendors; build session API

#### VL-123 — African sector packs

- **Goal:** Expand vertical glossaries + coverage CTAs into sellable EN↔African packs (gov/health/banking/media).
- **Complexity:** M
- **Depends on:** VL-103, VL-100
- **Buy vs build:** Build content + install UX

#### VL-124 — Named library pull-in

- **Goal:** One concrete v1/v2 section named after VL-123 ships (not “everything in the libraries”).
- **Complexity:** TBD
- **Depends on:** VL-123 + explicit section choice

#### VL-125 — Cloud Platform Foundation (library Phase 1 mapped)

- **Goal:** Map library Cloud Console / Accounts / Orgs / Projects / Flags / Dashboard onto existing modules; ship workspaces API, feature flags, `/dashboard` + `GET /v1/cloud/overview`. Do **not** regenerate identity/billing/regions or invent AZs / service discovery.
- **Complexity:** M
- **Depends on:** VL-012, VL-031, VL-075
- **Buy vs build:** Extend Nest/Next; docs in `CLOUD_PLATFORM_FOUNDATION.md` + ADR-0046
- **Sources:** Library Phase 1 “Cloud Platform Foundation”
- **Out of scope:** Control-plane rewrite, AZ topology, Consul/K8s discovery, LaunchDarkly product

#### VL-126 — Identity Cloud (library Phase 2 mapped)

- **Goal:** Map library Identity Cloud onto Clerk + Lugemi RBAC/API keys/audit. Ship membership role/remove APIs, Clerk org-role sync, API key `lastUsedAt`, `/identity` + `GET /v1/identity/overview`.
- **Complexity:** M
- **Depends on:** VL-010–013, VL-032
- **Buy vs build:** Clerk for human IdP; Lugemi for tenant RBAC + machine keys
- **Sources:** Library Phase 2 “Identity Cloud”
- **Out of scope:** First-party SAML/SCIM/ABAC/Teams/passkeys/MFA engines; custom OAuth AS

#### VL-127 — Developer Cloud Foundation (library Phase 3 mapped)

- **Goal:** Map library Developer Cloud onto existing portal (keys, OpenAPI, docs, playground, SDK, billing, usage). Ship `/developers` + overview API, soft `lg_test_` keys, thin `@lugemi/cli`, playground detect/languages.
- **Complexity:** M
- **Depends on:** VL-013, VL-030, VL-033, VL-031
- **Buy vs build:** Extend Nest/Next/SDK; docs in `DEVELOPER_CLOUD.md` + ADR-0048
- **Sources:** Library Phase 3 “Developer Cloud Foundation”
- **Out of scope:** OAuth client registry, App Store Applications, separate sandbox cluster, multi-lang SDK factory

#### VL-128 — Enterprise Cloud Foundation (library Phase 4 mapped)

- **Goal:** Map library Enterprise Cloud onto governance, admin, residency, RBAC, and billing quotas. Ship `/enterprise` + `GET /v1/enterprise/overview|policies`; surface vendor-training policy on translate audits.
- **Complexity:** M
- **Depends on:** VL-073, VL-075, VL-081, VL-126
- **Buy vs build:** Compose existing modules; docs in `ENTERPRISE_CLOUD.md` + ADR-0049
- **Sources:** Library Phase 4 “Enterprise Cloud Foundation”
- **Out of scope:** Policy-as-Code engine, SOC2 Trust Center product, automated retention sweeper, ABAC

#### VL-129 — AI Gateway Cloud Foundation (library Phase 5 mapped)

- **Goal:** Map library AI Gateway Cloud onto thin `GatewayService` + model registry. Ship `/gateway` + provider catalog/overview; optional OpenRouter OpenAI-compatible chat fallback. Closes Volume 1 Part A.
- **Complexity:** M
- **Depends on:** VL-021, VL-110
- **Buy vs build:** Extend gateway; docs in `AI_GATEWAY_CLOUD.md` + ADR-0050
- **Sources:** Library Phase 5 “AI Gateway Cloud Foundation”
- **Out of scope:** Claude/Gemini/DeepSeek/Qwen/Llama/Mistral/NeMo first-class adapters, response cache, streaming-for-all, cost optimizer, Inference Cloud

#### VL-130 — Language Cloud Foundation (library Phase 6 mapped)

- **Goal:** Map library Language Cloud onto M5/M10 language products. Ship `/language` + product catalog/overview. Parent hub for translate, detect, glossary, TM, quality, localize, locales, coverage.
- **Complexity:** M
- **Depends on:** VL-020, VL-050–054, VL-102, VL-100
- **Buy vs build:** Compose existing modules; docs in `LANGUAGE_CLOUD.md` + ADR-0051
- **Sources:** Library Phase 6 “Language Cloud Foundation”
- **Out of scope:** Dialect/accent/grammar/style AI, GraphQL, CQRS/hexagonal rewrite, unlimited dialects, country pack SKUs, K8s/Terraform regen

#### VL-131 — Dialect detection (Language Cloud queue #1)

- **Goal:** Curated `dialects` registry + cue-scored `POST /v1/dialects/detect` + console `/dialects`. Optional LLM assist among registry candidates only.
- **Complexity:** M
- **Depends on:** VL-130, VL-054, gateway detect/chat
- **Buy vs build:** Heuristic cues first; OpenAI assist when weak; ADR-0052
- **Sources:** Language Cloud deferred dialect item
- **Out of scope:** Accent detection, unlimited dialects, speech accent models, GraphQL/CQRS

#### VL-132 — Accent detection (Language Cloud queue #2)

- **Goal:** Curated spoken `accents` profiles + `POST /v1/accents/detect` (text and/or audio→STT) + console `/accents`. Transcript-assisted cues; optional LLM among candidates.
- **Complexity:** M
- **Depends on:** VL-131, VL-041 STT, gateway
- **Buy vs build:** STT + cue profiles; acoustic accent ID remains buy/VL-122; ADR-0053
- **Sources:** Language Cloud deferred accent item
- **Out of scope:** Acoustic phonetics model, unlimited accents, GraphQL/CQRS

#### VL-133 — Grammar AI (Language Cloud queue #3)

- **Goal:** `POST /v1/grammar/check` with deterministic English-leaning rules + optional LLM structured assist; console `/grammar`.
- **Complexity:** M
- **Depends on:** VL-130, VL-060 chat gateway
- **Buy vs build:** Rules first; OpenAI assist when keyed; ADR-0054
- **Sources:** Library Grammar Intelligence (bounded)
- **Out of scope:** Grammarly parity, medical/legal/gov writing products, morphology engine, style packs (VL-134)

#### VL-134 — Writing Style AI (Language Cloud queue #4)

- **Goal:** Bounded style profiles + `POST /v1/style/rewrite` (rules + optional LLM) + console `/style`.
- **Complexity:** M
- **Depends on:** VL-133, VL-060
- **Buy vs build:** Deterministic transforms first; OpenAI rewrite when keyed; ADR-0055
- **Sources:** Library Style Intelligence (bounded)
- **Out of scope:** Legal/medical/marketing/gov writing products, arbitrary author style transfer, GraphQL

#### VL-135 — Country / regional locale packs (Language Cloud queue #5)

- **Goal:** Curated ISO country packs composing VL-102 language locale packs; `GET /v1/country-packs` + console `/countries`.
- **Complexity:** M
- **Depends on:** VL-102, VL-130–134 registries
- **Buy vs build:** Seeded guidance tables; ADR-0056
- **Sources:** Language Cloud deferred country packs
- **Out of scope:** CLDR sync, billing SKUs, regenerating locale_packs, GraphQL

#### VL-136 — GraphQL Language Cloud façade (queue #6)

- **Goal:** NestJS Apollo `/graphql` over existing Language Cloud services (queries + auth mutations). REST stays primary.
- **Complexity:** M
- **Depends on:** VL-130–135
- **Buy vs build:** `@nestjs/graphql` + Apollo; ADR-0057
- **Sources:** Library GraphQL ask (bounded)
- **Out of scope:** Federation, full-API GraphQL, CQRS/hexagonal rewrite

#### VL-137 — Bounded CQRS + ports/adapters (queue #7)

- **Goal:** Language Cloud application layer with ports/adapters and `@nestjs/cqrs` commands/queries; GraphQL uses buses.
- **Complexity:** M
- **Depends on:** VL-136
- **Buy vs build:** Nest CQRS + thin adapters over existing services; ADR-0058
- **Sources:** Library CQRS/hex ask (bounded)
- **Out of scope:** Event sourcing, monolith-wide hexagonal, Terraform/K8s

#### VL-138 — AWS EKS + Terraform (af-south-1)

- **Goal:** Optional AWS EKS cluster via Terraform + Kubernetes manifests for api/web; Fly remains default PaaS.
- **Complexity:** M
- **Depends on:** VL-074 Docker images, operator cloud choice
- **Buy vs build:** AWS EKS/VPC; managed Postgres/Redis still buy; ADR-0059
- **Sources:** Language Cloud deferred Terraform/K8s
- **Out of scope:** Multi-region mesh, self-hosted Postgres on K8s, replacing Fly

#### VL-139 — Enterprise Language Registry (Phase 7)

- **Goal:** Curated enterprise registry covering registered languages, families, writing systems/scripts/alphabets, locales, and pronunciation/grammar/phonetic/morphology *rule catalogs* — plus REST, SDK, admin `/registry`, analytics, validation, monitoring, docs, production seed.
- **Complexity:** M
- **Depends on:** VL-020, VL-102, VL-131–135
- **Buy vs build:** Build catalog + APIs; buy nothing new
- **Sources:** v2 Phase 7 library prompt; ADR-0060
- **Out of scope:** Ethnologue parity, full CLDR dump, morphology/phonetics engines

#### VL-140 — Translation Engine (Phase 8)

- **Goal:** Consolidate Lugemi Translate: engine catalog, HTML/Markdown/XML/CSV/SRT codecs, SSE streaming, chat-message MT, GraphQL translate, SDK/CLI/docs — on top of existing realtime/batch/docs/localize/TM/glossary/quality/Slack.
- **Complexity:** M
- **Depends on:** VL-022–053, VL-044, VL-082
- **Buy vs build:** Continue buying MT; build format/stream façade
- **Sources:** v2 Phase 8 library prompt; ADR-0061
- **Out of scope:** Website crawler, email MIME MT, WhatsApp/Teams/SMS, PPTX/XLSX, layout-faithful PDF

#### VL-141 — Localization Platform (Phase 9)

- **Goal:** Software-string localization platform: ICU validate/format, catalog inventory, L10n QA, RTL layout metadata, timezone-aware locale format, GraphQL/SDK/CLI/dashboard — on VL-053 + VL-102.
- **Complexity:** M
- **Depends on:** VL-053, VL-102, VL-140
- **Buy vs build:** Build ICU/QA façade; Intl for formats
- **Sources:** v2 Phase 9 library prompt; ADR-0062
- **Out of scope:** Website/mobile/desktop/game TMS, Phrase/Lokalise parity, screenshot QA

#### VL-142 — Grammar Intelligence (Phase 10)

- **Goal:** Consolidate grammar/spell/correct/suggest + style profiles (incl. medical/legal/government *tone* with disclaimers), catalog, analytics, GraphQL/SDK/dashboard on VL-133/134.
- **Complexity:** M
- **Depends on:** VL-133, VL-134
- **Buy vs build:** Rules + optional LLM; no specialty writing OS
- **Sources:** v2 Phase 10 library prompt; ADR-0063
- **Out of scope:** Grammarly parity, certified medical/legal/gov writing products, morphology engine

#### VL-143 — Style Intelligence (Phase 11)

- **Goal:** Style Intelligence hub — formal/professional/academic/legal/medical/business/marketing/technical/government/casual profiles, tone detect/transform/transfer, REST/GraphQL/SDK/analytics/dashboard on VL-134/142.
- **Complexity:** M
- **Depends on:** VL-134, VL-142
- **Buy vs build:** Heuristic detect + rules/LLM rewrite; no author cloning
- **Sources:** v2 Phase 11 library prompt; ADR-0064
- **Out of scope:** Author style transfer models, certified marketing/legal/medical writing products

#### VL-144 — Language Intelligence (Phase 12)

- **Goal:** Language Intelligence Platform — façade over language/dialect/accent detection plus heuristic intent/sentiment/emotion/readability/complexity and translation/speech confidence; REST/SSE/GraphQL/SDK/dashboard.
- **Complexity:** M
- **Depends on:** VL-054, VL-131, VL-132, VL-143
- **Buy vs build:** Heuristics + existing detect; no NLP research OS
- **Sources:** v2 Phase 12 library prompt; ADR-0065
- **Out of scope:** Trained NLU/sentiment suites, acoustic emotion, Whisper-native confidence

#### VL-145 — Enterprise Translation Memory (Phase 13)

- **Goal:** Enterprise TM — workspace/enterprise/shared/project scopes, glossary/terminology links, history, lexical (+ optional vector) similarity, versioning, REST/GraphQL/SDK/dashboard on VL-051.
- **Complexity:** M
- **Depends on:** VL-051, VL-050, VL-063
- **Buy vs build:** Extend exact TM; OpenAI embeddings optional for vector
- **Sources:** v2 Phase 13 library prompt; ADR-0066
- **Out of scope:** Phrase/MemoQ/Trados parity, TMX sync, full project TMS

#### VL-146 — Language Analytics (Phase 14)

- **Goal:** Language Analytics Platform — translation/language/country/dialect usage, quality/accuracy proxy, latency, costs, enterprise reports on VL-085 usage/quality/audit data.
- **Complexity:** M
- **Depends on:** VL-085, VL-051, VL-131, VL-132
- **Buy vs build:** SQL aggregates over existing tables; no warehouse
- **Sources:** v2 Phase 14 library prompt; ADR-0067
- **Out of scope:** BI cloud, geo-IP analytics, BLEU/human eval accuracy, scheduled exports

#### VL-147 — Language Cloud Production Audit (Phase 15)

- **Goal:** Audit gate for Language Cloud VL-130–146 — TODO/placeholder scan, integration/security/API/bounded load evidence, architecture/performance/coverage/readiness/deployment reports.
- **Complexity:** S
- **Depends on:** VL-130–146
- **Buy vs build:** Evidence only; no new product surface
- **Sources:** v2 Phase 15 library audit prompt; ADR-0068
- **Out of scope:** Competitor-parity marketing, Speech Cloud kickoff, inventing k6/axe platforms

#### VL-150 — Speech Cloud Foundation (Phase 16)

- **Goal:** Map library Speech Cloud onto existing audio/voice modules; ship `/speech` + `GET /v1/speech/products` + `GET /v1/speech/overview`, bounded CQRS catalog port, GraphQL `speechProducts`, OpenAPI, thin SDK/CLI. Do **not** regenerate Language Cloud / Identity / Gateway or invent streaming/speaker OS.
- **Complexity:** M
- **Depends on:** VL-041, VL-042, VL-061, VL-064, VL-147
- **Buy vs build:** Extend Nest/Next; docs in `SPEECH_CLOUD.md` + ADR-0069
- **Sources:** Library Phase 16 “Speech Cloud Foundation”
- **Out of scope:** Streaming STT, Speaker/Emotion/Audio/Pronunciation/Wake-Word/Call Intelligence engines, Audio Enhancement, Speech Analytics product (Phases 17–25), greenfield DDD rewrite of `AudioModule`

#### VL-151 — Speech Recognition Engine (Phase 17)

- **Goal:** Lugemi Speech Recognition — batch recognize with timestamps/confidence, segment SSE stream, multilingual/auto-detect, custom + industry vocabulary, subtitles, punctuation/capitalization, engine catalog, GraphQL/SDK/dashboard/analytics hooks. Extend Whisper; do not claim live-mic WebSocket ASR OS.
- **Complexity:** L
- **Depends on:** VL-041, VL-150
- **Buy vs build:** Buy Whisper; build engine façade + vocab/subtitles/SSE
- **Sources:** Library Phase 17; ADR-0070
- **Out of scope:** Bidirectional live-mic WebSocket, Deepgram/AssemblyAI parity, Speech Analytics product (Phase 25)

#### VL-152 — Speaker Intelligence (Phase 18)

- **Goal:** Speaker profiles, local voice fingerprints, 1:1 verification, 1:N identification, gap-based diarization over Whisper segments, history, engine catalog, GraphQL/SDK/console. Honest partial — not NIST biometrics or neural diarization.
- **Complexity:** L
- **Depends on:** VL-150, VL-151
- **Buy vs build:** Build local fingerprint + gap diarization; buy neural diarization later if needed
- **Sources:** Library Phase 18; ADR-0071
- **Out of scope:** NIST-grade biometrics, anti-spoof, pyannote/Deepgram diarization parity, regenerating voice clones as verification

#### VL-153 — Accent Intelligence (Phase 19)

- **Goal:** Accent Intelligence façade over VL-132 — engine catalog, classify (ranked + confidence band), analytics, GraphQL/SDK/console. Cross-link dialect detect (Language Cloud). Defer acoustic regional models.
- **Complexity:** M
- **Depends on:** VL-132, VL-150
- **Buy vs build:** Extend cue engine; buy acoustic models later if needed
- **Sources:** Library Phase 19; ADR-0072
- **Out of scope:** Acoustic phonetics ID, regenerating dialects module, unlimited accent catalogs

#### VL-154 — Emotion Intelligence (Phase 20)

- **Goal:** Speech Cloud emotion detect for happy/sad/angry/fear/neutral/stress/confidence/excitement/urgency — text cues, optional audio→STT + soft energy proxies, SSE stream, engine/analytics, GraphQL/SDK/console. Do not regenerate Language Intelligence emotion.
- **Complexity:** M
- **Depends on:** VL-150, VL-151
- **Buy vs build:** Build cue engine; buy trained SER later if needed
- **Sources:** Library Phase 20; ADR-0073
- **Out of scope:** Trained acoustic SER, Affectiva/Hume parity, regenerating VL-144 emotion endpoints

#### VL-155 — Audio Intelligence (Phase 21)

- **Goal:** Noise/silence analysis, noise-gate enhancement, linear upscaling, energy VAD isolation — REST/SSE/SDK/console/monitoring on shared deploy. Echo cancellation deferred (needs AEC reference/vendor).
- **Complexity:** M
- **Depends on:** VL-150
- **Buy vs build:** Build PCM DSP; buy neural denoise/AEC later if needed
- **Sources:** Library Phase 21; ADR-0074
- **Out of scope:** Krisp/Demucs/Adobe Enhance parity, live AEC WebSocket, generative audio upscaling

#### VL-156 — Pronunciation Intelligence (Phase 22)

- **Goal:** Pronunciation assess/score/coach for language learning — word alignment vs reference, fluency proxies, grapheme phoneme/stress heuristics, analytics/dashboard/SDK. Forced-alignment phonemes deferred.
- **Complexity:** M
- **Depends on:** VL-150, VL-151
- **Buy vs build:** Build alignment heuristics; buy specialty pronunciation ASR later if needed
- **Sources:** Library Phase 22; ADR-0075
- **Out of scope:** ELSA/SpeechAce parity, CEFR certification, acoustic accent coaching models

#### VL-157 — Wake Word Engine (Phase 23)

- **Goal:** Wake word detection, keyword spotting, custom phrases, enterprise trigger hits, SSE streaming — via text/STT spotting. On-device always-on DNN deferred.
- **Complexity:** M
- **Depends on:** VL-150, VL-151
- **Buy vs build:** Build transcript spotting; buy Porcupine-class models later if needed
- **Sources:** Library Phase 23; ADR-0076
- **Out of scope:** Picovoice/Snowboy parity, continuous mic DNN, workflow orchestration OS

#### VL-158 — Call Intelligence (Phase 24)

- **Goal:** Contact-center call ingest (recording upload + transcript), STT, heuristic summary/topics/intent/sentiment/emotion/compliance/coaching/QA, reports, GraphQL/SDK/dashboard. Do not regenerate Voice FAQ.
- **Complexity:** M
- **Depends on:** VL-150, VL-151
- **Buy vs build:** Build heuristic analytics; buy CCaaS/Gong-class vendors later if needed
- **Sources:** Library Phase 24; ADR-0077
- **Out of scope:** Gong/Chorus parity, realtime dialer agent-assist, legal compliance certification

#### VL-159 — Speech Analytics (Phase 25)

- **Goal:** Speech usage, languages, dialects, cost estimates, accuracy proxies, latency/error snapshots, customers/industries aggregates, dashboard/report — over usage_events + speech audits. Do not regenerate Language Analytics.
- **Complexity:** M
- **Depends on:** VL-150, VL-151
- **Buy vs build:** Build aggregates; buy BI/WER vendors later if needed
- **Sources:** Library Phase 25; ADR-0078
- **Out of scope:** BI cloud, NIST WER lab, regenerating `/v1/analytics`

#### VL-160 — Speech Cloud Production Audit (Phase 26)

- **Goal:** Checklist + evidence pack over VL-150–159 (TODO scan, catalog/auth/SSE/load smokes, reports). Accept 12-layer Cloud Blueprint (ADR-0080). Reject competitor-parity marketing and invented k6/axe platforms.
- **Complexity:** S
- **Depends on:** VL-150–159
- **Buy vs build:** N/A (audit gate)
- **Sources:** Library Phase 26; ADR-0079, ADR-0080
- **Out of scope:** New speech features, empty Voice/Vision clouds, commercial speech-OS parity claims

---

## M13 — Voice Cloud volume (library Phases 27–36)

Executable Voice Cloud phases. Extend TTS/clones/studio — do not regenerate Speech or Language Cloud. Phase pack: `docs/roadmap/volume3-voice-cloud/`.

#### VL-170 — Voice Cloud Foundation (Phase 27)

- **Goal:** `/voice-cloud` hub + catalog/overview + bounded CQRS/GraphQL; map library Voice products onto VL-042/064/120/121/152/155 with honest deferred flags.
- **Complexity:** S
- **Depends on:** VL-042, VL-064, VL-120, VL-121, VL-160
- **Buy vs build:** Build hub; buy TTS/clone vendors
- **Sources:** Library Phase 27; ADR-0081
- **Out of scope:** New synthesis engines, emotion TTS, marketplace, regenerating Speech Cloud

#### VL-171 — Neural Text-to-Speech (Phase 28)

- **Goal:** Productize streaming/batch TTS surfaces, natural voice catalog honesty, dialects/accents/personalities where vendors allow — over existing speech endpoint.
- **Complexity:** M
- **Depends on:** VL-170, VL-042, VL-121
- **Buy vs build:** Buy vendor TTS; build API/product façade
- **Sources:** Library Phase 28
- **Out of scope:** Training a frontier TTS model in-house

#### VL-172 — Voice Cloning Platform (Phase 29)

- **Goal:** Extend VL-064 consent/review/watermark for professional + instant cloning, ownership/licensing/permissions — wire Identity/Trust, not ToS-only checkboxes.
- **Complexity:** M
- **Depends on:** VL-170, VL-064
- **Buy vs build:** Buy Instant Voice Cloning vendor; build consent/audit/governance
- **Sources:** Library Phase 29; ADR-0042
- **Out of scope:** Cloning without consent capture; skipping abuse review

#### VL-173 — Emotion Voice Engine (Phase 30)

- **Goal:** Emotion-conditioned synthesis (happy/sad/…/domain tones) if vendor supports; else honest deferred.
- **Complexity:** M
- **Depends on:** VL-170, VL-171
- **Buy vs build:** Buy expressive TTS vendor features
- **Sources:** Library Phase 30
- **Out of scope:** Confusing with VL-154 speech emotion *detection*

#### VL-174 — Voice Studio (Phase 31)

- **Goal:** Extend `/audio` with pronunciation/SSML/timeline/comparison where feasible without inventing a DAW.
- **Complexity:** M
- **Depends on:** VL-170, VL-120
- **Buy vs build:** Build UX over existing APIs
- **Sources:** Library Phase 31
- **Out of scope:** Full nonlinear video/audio NLE

#### VL-175 — Voice Enhancement Platform (Phase 32)

- **Goal:** Expand Audio Intelligence enhance path toward cleanup/restoration/mastering with honest capability limits.
- **Complexity:** M
- **Depends on:** VL-170, VL-155
- **Buy vs build:** Heuristics first; buy spectral ML later if paid
- **Sources:** Library Phase 32
- **Out of scope:** Adobe Enhance / Krisp parity claims

#### VL-176 — Voice Biometrics (Phase 33)

- **Goal:** Harden speaker verify/identify toward auth with encryption-at-rest, deletion path, anti-spoof/liveness as far as honest heuristics allow.
- **Complexity:** L
- **Depends on:** VL-170, VL-152
- **Buy vs build:** Prefer specialist vendor for NIST-grade; build governance
- **Sources:** Library Phase 33
- **Out of scope:** Claiming NIST/PAD certification without evidence

#### VL-177 — Voice Marketplace (Phase 34)

- **Goal:** Publish/license/sell voice SKUs with ratings — distinct from localization Marketplace.
- **Complexity:** L
- **Depends on:** VL-170, VL-172, VL-090
- **Buy vs build:** Build catalog + Stripe; legal review required
- **Sources:** Library Phase 34
- **Out of scope:** Celebrity voice SKUs without rights chain

#### VL-178 — Voice Analytics (Phase 35)

- **Goal:** Voice usage/voices/revenue/latency/quality aggregates over usage_events + clone audits.
- **Complexity:** M
- **Depends on:** VL-170, VL-171
- **Buy vs build:** Build aggregates
- **Sources:** Library Phase 35
- **Out of scope:** Regenerating Speech Analytics

#### VL-179 — Voice Cloud Production Audit (Phase 36)

- **Goal:** Checklist + evidence pack over VL-170–178. Reject competitor-parity marketing.
- **Complexity:** S
- **Depends on:** VL-170–178
- **Buy vs build:** N/A (audit gate)
- **Sources:** Library Phase 36
- **Out of scope:** New voice features during audit

### Volume 5 — Intelligence Cloud (VL-180–192)

Library Phases 47–59. Hub over LLM gateway + embeddings + RAG. **Not** a custom AI kernel.

#### VL-180 — Intelligence Cloud Foundation (Phase 47)

- **Goal:** Parent hub `/intelligence-cloud` + catalog/overview + bounded CQRS/GraphQL over chat/embeddings/knowledge. Honest deferred map for memory/graph/reasoner/orchestration.
- **Complexity:** S
- **Depends on:** VL-060, VL-062, VL-063, VL-179
- **Buy vs build:** Map existing gateway primitives
- **Sources:** Library Phase 47
- **Out of scope:** Custom AI kernel, regenerating Chat/RAG/Embeddings

#### VL-181 — Embedding Cloud (Phase 48)

- **Goal:** Productize embeddings hub over VL-063; multilingual text first; defer speech/image/video/cross-modal.
- **Complexity:** M
- **Depends on:** VL-180, VL-063
- **Buy vs build:** OpenAI/Gemini embeddings
- **Sources:** Library Phase 48
- **Out of scope:** Training embedding models; full multimodal OS

#### VL-182 — Vector Cloud (Phase 49)

- **Goal:** Vector search hub over pgvector (VL-062); optional dedicated vector DB only if scale forces it.
- **Complexity:** M
- **Depends on:** VL-180, VL-062
- **Buy vs build:** Postgres + pgvector first
- **Sources:** Library Phase 49
- **Out of scope:** Pinecone-parity managed vector OS on day one

#### VL-183 — Memory Cloud (Phase 50)

- **Goal:** Persistent interaction memory with **GDPR delete/export** before real user data.
- **Complexity:** M
- **Depends on:** VL-180, VL-012
- **Buy vs build:** Postgres + consent/audit
- **Sources:** Library Phase 50
- **Out of scope:** Infinite personalization OS without deletion path

#### VL-184 — Knowledge Graph Cloud (Phase 51)

- **Goal:** Bounded entity/relationship layer or honest deferral to RAG; not Neo4j enterprise KG OS.
- **Complexity:** M
- **Depends on:** VL-180, VL-062
- **Buy vs build:** Prefer RAG; graph vendor only if customer-paid
- **Sources:** Library Phase 51
- **Out of scope:** Ontology/taxonomy platforms (vision backlog)

#### VL-185 — Context Engine (Phase 52)

- **Goal:** Assemble retrieval + memory + prompt context for AI requests.
- **Complexity:** M
- **Depends on:** VL-180, VL-182, VL-183
- **Buy vs build:** Build orchestration helpers
- **Sources:** Library Phase 52
- **Out of scope:** Infinite context window product claims

#### VL-186 — Reasoning Cloud (Phase 53)

- **Goal:** Multi-step reasoning via LLM gateway prompts/tools — not a custom reasoner kernel.
- **Complexity:** M
- **Depends on:** VL-180, VL-060
- **Buy vs build:** LLM + gateway
- **Sources:** Library Phase 53
- **Out of scope:** Proprietary symbolic reasoner OS

#### VL-187 — Recommendation Engine (Phase 54)

- **Goal:** Recommendations over embeddings/memory for workspace content/voices/languages.
- **Complexity:** M
- **Depends on:** VL-180, VL-181
- **Buy vs build:** Build light rankers
- **Sources:** Library Phase 54
- **Out of scope:** Retail recommender OS

#### VL-188 — Prompt Intelligence (Phase 55)

- **Goal:** Prompt management/optimization hub over versioned prompts.
- **Complexity:** S
- **Depends on:** VL-180, VL-060
- **Buy vs build:** Extend existing prompt versioning
- **Sources:** Library Phase 55
- **Out of scope:** Auto-prompt research lab

#### VL-189 — AI Decision Engine (Phase 56)

- **Goal:** Bounded decision helpers (policy/routing) over LLM + rules — not enterprise BRMS.
- **Complexity:** M
- **Depends on:** VL-180
- **Buy vs build:** LLM + light rules
- **Sources:** Library Phase 56
- **Out of scope:** Drools/Pega parity

#### VL-190 — AI Orchestration (Phase 57)

- **Goal:** Load-bearing orchestration that coordinates gateway/engines; exercise real e2e requests.
- **Complexity:** L
- **Depends on:** VL-180–189
- **Buy vs build:** Build on gateway
- **Sources:** Library Phase 57
- **Out of scope:** Multi-cloud agent OS

#### VL-191 — Intelligence Analytics (Phase 58)

- **Goal:** Usage/quality analytics for Intelligence Cloud surfaces.
- **Complexity:** M
- **Depends on:** VL-180
- **Buy vs build:** Build aggregates
- **Sources:** Library Phase 58
- **Out of scope:** Regenerating Language/Speech/Voice analytics

#### VL-192 — Intelligence Cloud Production Audit (Phase 59)

- **Goal:** Checklist + evidence pack over VL-180–191. Reject custom-kernel / competitor-parity marketing.
- **Complexity:** S
- **Depends on:** VL-180–191
- **Buy vs build:** N/A (audit gate)
- **Sources:** Library Phase 59
- **Out of scope:** New intelligence features during audit

---

## Vision backlog (explicitly not scheduled)

These are in the libraries. They are **not** executable phases for a small team. Do not generate code for them. Do not mark them Done by creating empty folders.

| Library home | What it is | What to do instead |
| --- | --- | --- |
| v2 10–12 Grammar/Style/Language Intelligence | Separate NLP companies | LLM prompts + glossary until proven |
| v2 18–25 Speaker/accent/emotion/pronunciation/wake-word/call intelligence | Speech research org | Vendor features if a customer pays |
| v2 30–35 Emotion voice, studio, enhancement, biometrics, voice marketplace | Voice company | Scheduled as VL-173–177; buy vendors + consent |
| v2 39–45 Document/invoice/ID/image intelligence, visual search | Vision company | Document AI vendor |
| v2 47–59 Intelligence Cloud (reasoner, decision engine, orchestration) | Custom AI kernel | Scheduled as VL-180+; LLM + gateway — no custom kernel |
| v2 63–67 Ontology, taxonomy, knowledge intelligence | Enterprise knowledge graph vendor | RAG (VL-062) |
| v2 71–90 Inference Cloud + AI Kernel | Internal AWS for models | Scheduled as VL-204+ (Volume 7 Inference); OpenAI/Groq today — no GPU hyperscaler OS; AI Kernel remains later |
| v2 91–105 Foundation Model Cloud | Frontier lab | VL-112 trained-weights still gated; VL-224+ honest platform/MLOps hub allowed (ADR-0135) |
| v2 106–115 AI Fabric | Internal bus architecture | VL-239–248 closed (Policy hard gate + audit); Kafka/NATS/Rabbit adapters deferred — not Kafka hyperscaler OS |
| v2 116–126 Ecosystem Cloud | Marketplace suite | VL-249 Foundation shipped (extends VL-090+/voice marketplace); VL-250–259 marketplaces/creator/audit remain — not payment-processor OS |
| v2 127–137 African Intelligence as 10 products | Sector AI startups | VL-100–103 content |
| v2 138–147 Research Cloud | Academic org | Notion + Git + eval harness |
| v2 148–158 MLOps Cloud | Platform team | W&B + CI |
| v2 159–168 Trust Cloud | GRC suite | VL-072–073 + lawyer |
| v2 169–180 Platform Engineering Cloud | Spotify Backstage clone | GitHub + docs |
| v2 181–200 Control Plane / Data Plane | Hyperscaler internals | One API app |
| v2 201–210 VAIOS | AI operating system | Never for MVP |
| v2 211–220 Enterprise Engineering System | Process bureaucracy | VL-001 |
| v2 221–230 Corporate OS | ERP | Use Notion/Linear/Gusto |
| v2 231–240 Global AI Standard | Standards body | Publish evals; don’t build ISO |
| v2 241–250 AI Economy | Fintech + labor market | Stripe |
| v2 251–260 Digital civilization | Nation-state platform | No |
| v2 261–300 AI Internet | Sci-fi federation | No |
| v2 v6.0 Global OS + six-repo split | End-state org chart | One monorepo now |
| v1 37 AIOps, 38 Performance platform, 39 DR as a product | SRE org | PaaS backups + Sentry |
| All `* Production Audit` phases | Rubber stamps after empty clouds | Real tests on the parent phase |

---

## Suggested override vs library order

Library order (especially v2) builds Language Cloud as 10 phases *before* billing, and Foundation Models *before* a single paying customer.

**Actual order for this company:**

```text
VL-000 → VL-001 → VL-002
      → VL-010 → VL-011 → VL-012 → VL-013
      → VL-020 → VL-021 → VL-022 → VL-023 → VL-024
      → VL-030 → VL-031 → VL-032 → VL-033
      → then M4–M6 as revenue demands
      → M7 before any “enterprise” claim
      → M10 in parallel once VL-022 works (eval cannot wait)
      → M8–M9–M11 only with customers or capital
```

**First code after this kickoff:** `PHASE_0_1.md` (VL-002, then VL-010 through VL-024 as two named phases).

---

## Session protocol (for every later Cursor chat)

```text
We are working phase-by-phase from ROADMAP.md and PROGRESS.md.

Current phase: [VL-XXX NAME]
Read PROGRESS.md and ARCHITECTURE.md first.

Rules:
- Only this phase.
- Extend existing code.
- No TODOs, no fake providers. If a credential is missing, stop and list it.
- Tests required for Done.
- Update PROGRESS.md and ARCHITECTURE.md when finished.
```

Paste **only** this file’s section for that VL-ID (plus `PHASE_0_1.md` when building those). Do not paste a library volume.
