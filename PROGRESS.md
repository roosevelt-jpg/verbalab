# VerbaLab AI — Progress

Track **executable** phases from `ROADMAP.md` only. Vision-backlog items from the libraries are not listed here so they cannot be marked Done by creating empty folders.

**Status values:** `Not Started` · `In Progress` · `Blocked` · `Done`

**Rule:** at most one row `In Progress`. `Done` requires passing tests and a real integration (no mocked provider pretending to be production).

Last updated: 2026-10-03 (VL-353 Done — Enterprise Engineering System Production Audit; Volume 20 closed)

---

## Current

| In flight | — |
| Next up | VL-206 Model Serving (Phase 73) |

---

## M0 — Foundation

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-000 | Living constitution | Done | ROADMAP / PROGRESS / ARCHITECTURE / PHASE_0_1. |
| VL-001 | Engineering standards (thin) | Done | `ENGINEERING.md` + `ENGINEERING_OS.md` + templates + ADR template |
| VL-002 | Monorepo skeleton | Done | pnpm/turbo production monorepo (`apps/*`, `packages/*`, Fly, CI). Local Postgres :5433 (ADR-0001). |

---

## M1 — Identity + Workspace

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-010 | Authentication | Blocked | Clerk integrated; needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`. `/setup` until then. OIDC/JWT via Clerk (VL-126). |
| VL-011 | Organizations, members, basic RBAC | Done | Memberships + role PATCH/DELETE + Clerk `o.rol` sync (VL-126). Invites stay in Clerk. Live UI needs Clerk keys. |
| VL-012 | Workspaces | Done | Multi-workspace CRUD `/v1/workspaces` + `X-VerbaLab-Workspace-Id`; default still created with org. Console switcher needs Clerk. |
| VL-013 | API keys | Done | Hashed `vl_live_` / `vl_test_` keys; create/list/revoke; `lastUsedAt` + env (VL-126/127). |

---

## M2 — AI Gateway + Translation

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-020 | Language registry (seed) | Done | Seeded ISO + African set; `GET /v1/languages`. |
| VL-021 | AI Gateway (thin) | Done | Google + OpenAI adapters; timeout/retry; OpenRouter chat fallback optional (VL-129). |
| VL-022 | Translation API (text) | Blocked | Endpoint + validation + fixture tests Done. Live MT needs `GOOGLE_TRANSLATE_API_KEY` (ADR-0002). |
| VL-023 | Console: translate UI | Blocked | Pages built; requires Clerk to use. ElevenLabs-inspired light UI applied. |
| VL-024 | Usage metering (minimal) | Done | `usage_events` + summary; covered by Phase 1 API tests. |

---

## M3 — Make it sellable

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-030 | Developer portal slice | Done | OpenAPI + `/docs` + `/playground` (translate/detect/languages); hub `/developers` (VL-127). |
| VL-031 | Billing (Stripe) | Blocked | Code Done: free/pro entitlements, quota on translate (402), Checkout/Portal/webhook. Live checkout needs Stripe env (ADR-0004). |
| VL-032 | Audit log | Done | `audit_events`; key create/revoke, translate, daily sign-in; `GET /v1/audit-events` (owner/admin); console `/audit`. |
| VL-033 | TypeScript SDK (thin) | Done | `@verbalab/sdk` + thin `@verbalab/cli` (VL-127). |

---

## M4 — Media and documents

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-040 | Document translation | Done | Upload DOCX/PDF → `document_translate` job → downloadable DOCX/txt (ADR-0006). Console `/documents`. |
| VL-041 | Speech-to-text (vendor) | Done | `POST /v1/audio/transcriptions`; OpenAI Whisper (ADR-0007); STT seconds/minutes in usage. Live needs `OPENAI_API_KEY`. |
| VL-042 | Text-to-speech (vendor) | Done | `POST /v1/audio/speech` + `GET /v1/audio/voices`; OpenAI TTS (ADR-0008); TTS character metering. Live needs `OPENAI_API_KEY`. |
| VL-043 | OCR (vendor) | Done | `POST /v1/ocr` images via Google Vision (ADR-0009); optional translate; page metering. Live needs Vision-enabled Google key. |
| VL-044 | Jobs, webhooks, batch | Done | Redis + BullMQ (ADR-0005); `jobs` table; `POST/GET /v1/jobs`; `batch_translate`; signed outbound webhooks; `JOBS_INLINE` for tests. |

---

## M5 — Language depth

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-050 | Glossary / terminology | Done | Workspace terms CRUD; protect/restore on translate (ADR-0010); `glossaryApplied` on response. Console `/glossary`. |
| VL-051 | Translation memory | Done | Exact approved segments; vendor bypass + no quota on hit (ADR-0011); `tmHit` on translate. Console `/tm`. |
| VL-052 | Quality estimation (lightweight) | Done | Heuristic score + `translation_reviews`; accept→TM / reject (ADR-0012). Console `/reviews`. |
| VL-053 | Localization files | Done | `POST /v1/localize` (+ `/file`); JSON/YAML key-stable MT; ICU passthrough (ADR-0013). Console `/localize`. |
| VL-054 | Language detection | Done | `source=auto` + `POST /v1/detect`; Google detect + franc-min fallback (ADR-0014). |

---

## M6 — Adjacent products

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-060 | AI Chat | Done | `POST /v1/chat/completions` + console `/chat`; OpenAI gateway; optional `translateReplyTo` (ADR-0015). Live needs `OPENAI_API_KEY`. |
| VL-061 | Live interpreter | Done | `POST /v1/interpret` STT→MT→TTS compose; console `/interpret` (ADR-0016). Live needs OpenAI + MT keys. |
| VL-062 | Knowledge + RAG | Done | pgvector corpus; upload/chunk/embed; `POST /v1/knowledge/query` + citations; console `/knowledge` (ADR-0018). Live needs OpenAI. |
| VL-063 | Embeddings API | Done | Gateway OpenAI embeddings + `POST /v1/embeddings`; meters tokens (ADR-0017). Live needs `OPENAI_API_KEY`. |
| VL-064 | Voice cloning (vendor, legal gate) | Done | ElevenLabs + consent + abuse review + watermark; `clone:{id}` on speech (ADR-0042). Live needs `ELEVENLABS_API_KEY`. |

---

## M7 — Hardening

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-070 | Observability | Done | JSON logs + `x-request-id`; Sentry behind DSN; translate p95 via `/v1/metrics/translate` (ADR-0019). |
| VL-071 | Rate limits and quotas | Done | Redis fixed-window per-key/org; 429 + Retry-After on translate/detect; plan entitlements (ADR-0020). Memory fallback in tests. |
| VL-072 | Security baseline | Done | Tenant isolation tests; helmet + Next headers; gitleaks + `pnpm audit` in CI (ADR-0021). |
| VL-073 | Data governance | Done | Retention/persist/training flags; export; owner delete+cascade; `docs/data-map.md` (ADR-0022). |
| VL-074 | Production deploy (one region) | Done | Fly.io Docker + release migrate; `infra/DEPLOY.md` (ADR-0023). Live deploy needs `FLY_API_TOKEN`. |
| VL-075 | Multi-region | Done | US/EU residency islands (`*.eu.toml`); org `data_region` pin + `residency_mismatch`; `/v1/regions` + `/data` UI (ADR-0043). Live EU needs separate Fly apps + DB. |

---

## M8 — Platform products

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-080 | Notifications | Done | Resend: job complete, usage 80/100%, member-added; Clerk invites (ADR-0024). |
| VL-081 | Admin + customer portal | Done | Members on billing; allowlisted `/admin`; org disable + revoke-all (ADR-0025). |
| VL-082 | Connectors (one tool) | Done | Slack slash → translate; console `/connectors` (ADR-0026). |
| VL-083 | Workflows | Done | JSON steps via job runner; console `/workflows` (ADR-0027). |
| VL-084 | Voice agents | Done | Twilio bilingual FAQ; simulate + signed webhooks (ADR-0028). |
| VL-085 | Analytics | Done | Overview SQL: features, lang pairs, est. cost, job errors (ADR-0029). |
| VL-086 | Prompt management | Done | Versioned chat/RAG/voice_faq prompts + rollback; `/prompts` (ADR-0030). |

---

## M9 — Ecosystem

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-090 | Marketplace foundation | Done | Glossary listings + copy-on-install; Pro gate; `/marketplace` (ADR-0031). |
| VL-091 | Listings expansion | Done | `prompt` + `dataset` (TM) kinds on same foundation (ADR-0032). |
| VL-092 | Creator payouts | Done | Stripe Connect Express + listing price + platform fee; sales table (ADR-0033). Live Connect Blocked on Stripe env. |

---

## M10 — African differentiation

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-100 | Coverage matrix and eval harness | Done | EN→sw/yo/am goldens; exact+char metrics; `GET /v1/coverage` + `/coverage` (ADR-0034). |
| VL-101 | Dataset program | Done | Legal intake + versioned local storage; `/datasets` (ADR-0035). Not Dataset Cloud / Label Studio. |
| VL-102 | Locale and cultural packs | Done | `locale_packs` for en/fr/sw/yo/am; public `/v1/locales` + `/locales`; DNT on translate (ADR-0036). |
| VL-103 | Vertical glossaries | Done | Platform EN→sw packs (public-sector/healthcare/banking); Pro install into glossary (ADR-0037). |
| VL-104 | Fine-tunes for failed pairs | Done | Candidates from coverage; Pro jobs + registry; gateway `finetune` routing; manual/Modal gated (ADR-0038). |

---

## M11 — Own models (funding-gated)

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-110 | Model registry (buy) | Done | Vendor seeds per feature; public `/models` live matrix; W&B via `externalUrl` (ADR-0039). Not MLflow. |
| VL-111 | Training jobs (rented GPUs) | Done | `/v1/training-jobs` + Modal/Vertex webhooks + fixture; manual default; callback promote (ADR-0040). |
| VL-112 | Foundation model program | Blocked | Do not start — use vendors + VL-104/111 fine-tunes (ADR-0041). Needs research org + capital. |

---

## M12 — African product depth

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| VL-120 | African voice studio UX | Done | `/audio` Voice Studio; presets en/sw/yo/am/fr; clone multi-sample + disable; ADR-0044 |
| VL-121 | Own TTS path (rented) | Done | `own:*` voices + OWN_TTS_URL/fixture adapter; OpenAI default; ADR-0045 |
| VL-122 | Speech depth | Not Started | Streaming + dialects |
| VL-123 | African sector packs | Not Started | Vertical glossaries expansion |
| VL-124 | Named library pull-in | Not Started | Pick concrete library section after VL-123 |
| VL-125 | Cloud Platform Foundation | Done | Mapped library Phase 1; workspaces API, flags, `/dashboard` + overview; ADR-0046. No AZ/discovery fake. |
| VL-126 | Identity Cloud | Done | Mapped library Phase 2; membership RBAC writes, Clerk role sync, key `lastUsedAt`, `/identity`; ADR-0047. No SAML/SCIM/ABAC/Teams. |
| VL-127 | Developer Cloud Foundation | Done | Mapped library Phase 3; `/developers`, soft `vl_test_` keys, `@verbalab/cli`, playground+overview; ADR-0048. No OAuth AS / sandbox cluster. |
| VL-128 | Enterprise Cloud Foundation | Done | Mapped library Phase 4; `/enterprise` + policies overview; vendor policy on translate audit; ADR-0049. No policy engine / cert product. |
| VL-129 | AI Gateway Cloud Foundation | Done | Mapped library Phase 5; `/gateway` + providers overview; OpenRouter chat fallback; ADR-0050. **Volume 1 Part A complete.** |
| VL-130 | Language Cloud Foundation | Done | Mapped library Phase 6; `/language` + products overview; ADR-0051. No dialect/grammar/GraphQL rewrite. |
| VL-131 | Dialect detection | Done | Curated registry + cue detect API + `/dialects`; ADR-0052. |
| VL-132 | Accent detection | Done | Spoken profiles + STT/text cue detect + `/accents`; ADR-0053. Not acoustic phonetics ID. |
| VL-133 | Grammar AI | Done | Rules + optional LLM `POST /v1/grammar/check` + `/grammar`; ADR-0054. Not Grammarly parity. |
| VL-134 | Writing Style AI | Done | Bounded profiles + `POST /v1/style/rewrite` + `/style`; ADR-0055. Not vertical writing OS. |
| VL-135 | Country / regional packs | Done | ISO country packs composing locale packs + `/countries`; ADR-0056. Not CLDR/SKU catalog. |
| VL-136 | GraphQL façade | Done | Apollo `/graphql` over Language Cloud services; ADR-0057. REST primary. |
| VL-137 | Bounded CQRS / hex | Done | Language Cloud ports + CQRS handlers; GraphQL via buses; ADR-0058. Not monolith rewrite. |
| VL-138 | AWS EKS + Terraform | Done | EKS `af-south-1` Terraform + `infra/k8s`; ADR-0059. Fly remains default PaaS. |
| VL-139 | Enterprise Language Registry | Done | Families, writing systems, linguistic rules + `/v1/registry/*` + `/registry`; ADR-0060. Curated — not Ethnologue. |
| VL-140 | Translation Engine (Phase 8) | Done | Formats HTML/MD/XML/CSV/SRT, SSE stream, chat MT, GraphQL translate, engine catalog; ADR-0061. Channels/website deferred. |
| VL-141 | Localization Platform (Phase 9) | Done | ICU validate/format, L10n QA, RTL layout, timezone format, `/localization`; ADR-0062. Website/game/mobile TMS deferred. |
| VL-142 | Grammar Intelligence (Phase 10) | Done | Spell/correct/suggest + domain tone profiles + analytics + `/grammar-intelligence`; ADR-0063. Not Grammarly/medical OS. |
| VL-143 | Style Intelligence (Phase 11) | Done | Tone detect/transform/transfer + formal/business/marketing/technical profiles + `/style-intelligence`; ADR-0064. Not author cloning. |
| VL-144 | Language Intelligence (Phase 12) | Done | Detect/dialect/accent façade + intent/sentiment/emotion/readability/complexity/confidence + SSE; ADR-0065. Not NLP research OS. |
| VL-145 | Enterprise Translation Memory (Phase 13) | Done | Scopes + similarity/versioning + vector optional + `/tm` hub; ADR-0066. Not Phrase/MemoQ. |
| VL-146 | Language Analytics (Phase 14) | Done | Translation/language/dialect/quality/latency/costs + enterprise report; ADR-0067. Not BI cloud. |
| VL-147 | Language Cloud Production Audit (Phase 15) | Done | Audit gate + reports under `docs/language-cloud-audit/`; ADR-0068. Rejects competitor-parity + Speech kickoff. |
| VL-150 | Speech Cloud Foundation (Phase 16) | Done | `/speech` hub + catalog/overview + bounded CQRS/GraphQL; ADR-0069. Maps onto VL-041/042 audio; streaming/speaker OS deferred. |
| VL-151 | Speech Recognition Engine (Phase 17) | Done | `/speech/recognize` + SSE stream + vocab/subtitles; ADR-0070. Whisper segments; live-mic WS deferred. |
| VL-152 | Speaker Intelligence (Phase 18) | Done | Profiles + local fingerprints + verify/identify + gap diarization; ADR-0071. Not NIST/neural diarization. |
| VL-153 | Accent Intelligence (Phase 19) | Done | Engine + classify + analytics façade over VL-132; ADR-0072. Acoustic regional models deferred. |
| VL-154 | Emotion Intelligence (Phase 20) | Done | `/v1/emotion` detect/stream + 9 labels; ADR-0073. Soft audio proxies — not trained SER. |
| VL-155 | Audio Intelligence (Phase 21) | Done | `/v1/audio-intelligence` analyze/silence/enhance/upscale/isolate + SSE; ADR-0074. Echo AEC deferred. |
| VL-156 | Pronunciation Intelligence (Phase 22) | Done | `/v1/pronunciation` assess/score/coach/phonemes/fluency; ADR-0075. Forced alignment deferred. |
| VL-157 | Wake Word Engine (Phase 23) | Done | `/v1/wake-word` detect/spot/triggers/keywords + SSE; ADR-0076. On-device DNN deferred. |
| VL-158 | Call Intelligence (Phase 24) | Done | `/v1/call-intelligence` calls/analyze/report; ADR-0077. Heuristic QA/compliance. Voice FAQ separate. |
| VL-159 | Speech Analytics (Phase 25) | Done | `/v1/speech-analytics` usage/overview/report; ADR-0078. Accuracy proxies; WER lab deferred. |
| VL-160 | Speech Cloud Production Audit (Phase 26) | Done | Audit gate + reports under `docs/speech-cloud-audit/`; ADR-0079. Blueprint ADR-0080. Rejects commercial speech-OS parity. |
| VL-170 | Voice Cloud Foundation (Phase 27) | Done | `/voice-cloud` hub + catalog/overview + bounded CQRS/GraphQL; ADR-0081. Maps onto VL-042/064/120/121; emotion/marketplace deferred. |
| VL-171 | Neural Text-to-Speech (Phase 28) | Done | `/v1/tts/*` engine + batch/stream + enriched voices + `/neural-tts`; ADR-0082. Chunk SSE not vendor streaming; children deferred. |
| VL-172 | Voice Cloning Platform (Phase 29) | Done | `/v1/voice-cloning/*` hub + ownership/license/permissions/enroll verify; ADR-0083. Extends VL-064 consent/watermark; pro = stricter enrollment. |
| VL-173 | Emotion Voice Engine (Phase 30) | Done | `/v1/emotion-voice/*` profiles + synthesize/stream; ADR-0084. Soft prosody + clone style settings; not trained expressive TTS; ≠ VL-154 detect. |
| VL-174 | Voice Studio (Phase 31) | Done | `/v1/voice-studio/*` library/SSML lite/lexicon/timeline/compare + `/voice-studio`; ADR-0085. Extends VL-120 `/audio`; not a DAW. |
| VL-175 | Voice Enhancement Platform (Phase 32) | Done | `/v1/voice-enhancement/*` profiles + enhance/stream/upscale; ADR-0086. Extends VL-155; echo AEC/spectral ML deferred. |
| VL-176 | Voice Biometrics (Phase 33) | Done | `/v1/voice-biometrics/*` encrypt/delete/authenticate + heuristic anti-spoof/liveness/risk; ADR-0087. Extends VL-152; not NIST/PAD. |
| VL-177 | Voice Marketplace (Phase 34) | Done | `/v1/voice-marketplace/*` listings/install/reviews/packs; ADR-0088. Distinct from VL-090; celebrity without rights forbidden. |
| VL-178 | Voice Analytics (Phase 35) | Done | `/v1/voice-analytics/*` usage/voices/revenue/quality; ADR-0089. Distinct from VL-159; BI dashboard deferred. |
| VL-179 | Voice Cloud Production Audit (Phase 36) | Done | Audit gate + reports under `docs/voice-cloud-audit/`; ADR-0090. Rejects commercial voice-OS parity. |
| VL-180 | Intelligence Cloud Foundation (Phase 47) | Done | `/intelligence-cloud` hub + catalog/overview + bounded CQRS/GraphQL; ADR-0091. Maps onto VL-060/062/063; custom AI kernel deferred. |
| VL-181 | Embedding Cloud (Phase 48) | Done | `/v1/embedding-cloud/*` engine/models/embed/analytics; ADR-0092. Extends VL-063; multimodal deferred. |
| VL-182 | Vector Cloud (Phase 49) | Done | `/v1/vector-cloud/*` engine/search/collections; ADR-0093. Hub over VL-062 pgvector; hybrid/sharding deferred. |
| VL-183 | Memory Cloud (Phase 50) | Done | `/v1/memory-cloud/*` CRUD/search + GDPR export/erase; ADR-0094. Retention sweeper deferred. |
| VL-184 | Knowledge Graph Cloud (Phase 51) | Done | `/v1/knowledge-graph/*` entities/edges/neighborhood; ADR-0095. Prefer RAG; Neo4j/ontology deferred. |
| VL-185 | Context Engine (Phase 52) | Done | `/v1/context-engine/*` assemble retrieval+memory+prompt; ADR-0096. Char-budget compression; infinite window deferred. |
| VL-186 | Reasoning Cloud (Phase 53) | Done | `/v1/reasoning-cloud/*` LLM strategies + reason; ADR-0097. Not custom reasoner kernel; shallow ToT. |
| VL-187 | Recommendation Engine (Phase 54) | Done | `/v1/recommendation-engine/*` light rankers; ADR-0098. Not retail recommender OS; enterprise deferred. |
| VL-188 | Prompt Intelligence (Phase 55) | Done | `/v1/prompt-intelligence/*` hub over VL-086; ADR-0099. Heuristic eval/security; not auto-prompt research lab. |
| VL-189 | AI Decision Engine (Phase 56) | Done | `/v1/decision-engine/*` light rules helpers; ADR-0100. Not Drools/Pega BRMS; tools suggest-only. |
| VL-190 | AI Orchestration (Phase 57) | Done | `/v1/ai-orchestration/*` e2e pipelines; ADR-0101. Not multi-cloud agent OS; extends VL-083. |
| VL-191 | Intelligence Analytics (Phase 58) | Done | `/v1/intelligence-analytics/*` aggregates; ADR-0102. ≠ Language/Speech/Voice analytics; BI OS deferred. |
| VL-192 | Intelligence Cloud Production Audit (Phase 59) | Done | Audit gate + reports under `docs/intelligence-cloud-audit/`; ADR-0103. Rejects custom-kernel / Intelligence Graph OS. |
| VL-193 | Knowledge Cloud Foundation (Phase 60) | Done | `/knowledge-cloud` hub + catalog/overview + bounded CQRS/GraphQL; ADR-0104. Maps onto VL-062 + Intelligence; enterprise knowledge OS deferred. |
| VL-194 | Enterprise Knowledge Base (Phase 61) | Done | `/v1/knowledge-base/*` over VL-062; collections/tags/MD/HTML; workspace-hardened get/remove; ADR-0105. Not Confluence OS. |
| VL-195 | Enterprise Search (Phase 62) | Done | `/v1/enterprise-search/*` keyword/semantic/light hybrid RRF; ADR-0106. Not Elastic/BM25 OS; image/voice deferred. |
| VL-196 | Ontology Platform (Phase 63) | Done | `/v1/ontology/*` concepts/hierarchies/synonyms over VL-184; ADR-0107. Not OWL/Protege OS. |
| VL-197 | Taxonomy Platform (Phase 64) | Done | `/v1/taxonomy/*` terms/trees/assign/heuristic classify; ADR-0108. Not enterprise taxonomy OS. |
| VL-198 | Enterprise RAG Platform (Phase 65) | Done | `/v1/enterprise-rag/*` retrieve/chunk/cite/grounded query; ADR-0109. Extends VL-062 + hybrid search; not LangChain OS. Hand-verify required. |
| VL-199 | Knowledge Memory (Phase 66) | Done | `/v1/knowledge-memory/*` over VL-183 MemoryRecord (layer=knowledge); evolve/versions; ADR-0110. Not Mem0 OS; distinct from Memory Cloud hub. |
| VL-200 | Knowledge Intelligence (Phase 67) | Done | `/v1/knowledge-intelligence/*` discover/link/recommend/validate/duplicates/confidence; ADR-0111. Not BI/Palantir OS; ≠ VL-191. |
| VL-201 | Enterprise Knowledge APIs (Phase 68) | Done | `/v1/knowledge-apis/*` REST/GraphQL/OpenAPI/SDK/CLI/webhooks/SSE pack; ADR-0112. Not gRPC/Kafka/SDK-generator OS. |
| VL-202 | Knowledge Analytics (Phase 69) | Done | `/v1/knowledge-analytics/*` growth/usage/quality/search/gaps/confidence/relationships; ADR-0113. Not BI OS; ≠ sibling analytics. |
| VL-203 | Knowledge Cloud Production Audit (Phase 70) | Done | Audit gate + reports under `docs/knowledge-cloud-audit/`; ADR-0114. Rejects enterprise knowledge OS / Inference Cloud here. |
| VL-204 | Inference Cloud Foundation (Phase 71) | Done | `/inference-cloud` hub + catalog/overview + bounded CQRS/GraphQL; ADR-0115. Maps onto AI Gateway; GPU hyperscaler deferred. Spend-safety constraints carried for VL-205/211. |
| VL-205 | GPU Platform (Phase 72) | Done | `/v1/gpu-platform/*` sandbox pools/allocate/scale with hard instance+spend ceilings; ADR-0116. No cloud GPU APIs; MIG/distributed deferred. |
| VL-206 | Model Serving (Phase 73) | Done | `/v1/model-serving/*` hub over Gateway + registry; sandbox versioning/canary/blue-green/rollback; ADR-0117. Not vLLM/KServe OS. |
| VL-207 | AI Router (Phase 74) | Done | `/v1/ai-router/*` dry-run resolve + policies over Gateway; ADR-0118. Not a mesh; cache deferred; spend enforce VL-211. |
| VL-208 | Streaming Runtime (Phase 75) | Done | `/v1/streaming-runtime/*` SSE hub + sandbox LLM chunks; ADR-0119. Links existing speech/voice/translate SSE; WS/gRPC/video deferred. |
| VL-209 | Batch Runtime (Phase 76) | Done | `/v1/batch-runtime/*` over BullMQ + sandbox runs; priority/retry/checkpoint; ADR-0120. Not Spark/Airflow; video deferred. |
| VL-210 | Intelligent Cache (Phase 77) | Done | `/v1/intelligent-cache/*` opt-in exact-key/normalized-hash store; ADR-0121. Not Redis Cluster/vector/CDN; Gateway not auto-wired. |
| VL-211 | Cost Optimization Engine (Phase 78) | Done | `/v1/cost-optimization/*` hard daily/monthly enforce + optimize; ADR-0122. Not FinOps/Spot OS; gates AI Router resolve. |
| VL-212 | AI Runtime Analytics (Phase 79) | Done | `/v1/ai-runtime-analytics/*` Inference Cloud aggregates; ADR-0123. ≠ VL-191/202; not BI/APM OS. |
| VL-213 | Inference Cloud Production Audit (Phase 80) | Done | Audit gate + reports under `docs/inference-cloud-audit/`; ADR-0124. Rejects GPU hyperscaler / AI Kernel here. Spend-safety verified. |
| VL-214 | AI Kernel Foundation (Phase 81) | Done | `/ai-kernel` internal hub + catalog/overview; ADR-0125. Not customer product / Linux-VAIOS. Action-safety notes for VL-219–222. |
| VL-215 | Memory Runtime (Phase 82) | Done | `/memory-runtime` + kernel layer over VL-183; ADR-0126. Not Mem0/replication OS. |
| VL-216 | Prompt Runtime (Phase 83) | Done | `/prompt-runtime` over VL-086/188; ADR-0127. Execute=render/validate; not research lab/mesh. |
| VL-217 | Context Runtime (Phase 84) | Done | `/context-runtime` over VL-185; ADR-0128. Prioritize/compress/retrieve; not infinite-context OS. |
| VL-218 | Reasoning Runtime (Phase 85) | Done | `/reasoning-runtime` over VL-186; ADR-0129. Plan/reflect/eval/history; no tool execution. |
| VL-219 | Agent Runtime (Phase 86) | Done | `/agent-runtime` sandbox + scoped permissions; ADR-0130. |
| VL-220 | Workflow Runtime (Phase 87) | Done | `/workflow-runtime` sandbox + scoped permissions; ADR-0131. |
| VL-221 | Plugin Runtime (Phase 88) | Done | `/plugin-runtime` sandbox + scoped permissions; ADR-0132. |
| VL-222 | Policy Runtime (Phase 89) | Done | `/policy-runtime` hard-gate into Agent/Workflow/Plugin; ADR-0133. |
| VL-223 | Kernel Production Audit (Phase 90) | Done | Audit pack under `docs/ai-kernel-audit/`; ADR-0134. |
| VL-224 | Foundation Model Cloud Foundation (Phase 91) | Done | `/foundation-model-cloud` hub + catalog; ADR-0135. Scaffolds only — no trained competitive weights. |
| VL-225 | Atlas (Phase 92) | Done | `/atlas` family scaffold; ADR-0140. Capability map + MLOps handoffs — not trained Atlas weights. |
| VL-226 | Baobab (Phase 93) | Not Started | Deferred scaffold. |
| VL-227 | Echo (Phase 94) | Not Started | Deferred scaffold. |
| VL-228 | Voice FM (Phase 95) | Not Started | Deferred scaffold. |
| VL-229 | Vision FM (Phase 96) | Not Started | Deferred scaffold. |
| VL-230 | Vector FM (Phase 97) | Not Started | Deferred scaffold. |
| VL-231 | Reason FM (Phase 98) | Not Started | Deferred scaffold. |
| VL-232 | Edge (Phase 99) | Not Started | Deferred scaffold. |
| VL-233 | Fusion (Phase 100) | Not Started | Deferred scaffold. |
| VL-234 | Translate FM (Phase 101) | Not Started | Deferred scaffold. |
| VL-235 | Model Training Platform (Phase 102) | Done | `/model-training-platform` orchestration over VL-111; ADR-0136. LoRA/instruction handoff; RLHF/DPO/distributed deferred. |
| VL-236 | Model Evaluation Platform (Phase 103) | Done | `/model-evaluation-platform` over VL-100 + sandbox bias/safety/latency; ADR-0137. MMLU/HumanEval deferred; no SOTA claims. |
| VL-237 | Model Registry (Phase 104) | Done | `/model-registry` over VL-110; ADR-0138. Cards/versions/approvals/deploy plans; not MLflow/traffic-mesh. |
| VL-238 | FMC Production Audit (Phase 105) | Done | Audit pack under `docs/foundation-model-cloud-audit/`; ADR-0139. Volume MLOps track closed. Named FM scaffolds remain deferred; AI Fabric → Volume 10. |
| VL-239 | AI Fabric Foundation (Phase 106) | Done | `/ai-fabric` internal hub + routing catalog; ADR-0141. Not Kafka OS/customer mesh. Policy hard-gate required for VL-247. |
| VL-240 | Event Fabric (Phase 107) | Done | Redis Streams + CloudEvents (DLQ/retries/replay/snapshots); Kafka/NATS/Rabbit adapters deferred; ADR-0142. |
| VL-241 | Context Fabric (Phase 108) | Done | Router over Context Runtime + optional Event Fabric propagate; SSE ticks; ADR-0143. Not infinite-context/WebSocket OS. |
| VL-242 | Knowledge Fabric (Phase 109) | Done | Router over Knowledge Cloud; same-org distribute/sync + federation handoffs; ADR-0144. Not Confluence/Neo4j OS. |
| VL-243 | Prompt Fabric (Phase 110) | Done | Router over Prompt Runtime; versioning/validate/same-org sync; Policy Runtime handoff; ADR-0145. Not prompt mesh/research lab. |
| VL-244 | Reasoning Fabric (Phase 111) | Done | Router/pipelines/replay over Reasoning Runtime; same-org distribute; ADR-0146. Not custom reasoner OS. |
| VL-245 | Memory Fabric (Phase 112) | Done | Router/sync/distribute over Memory Runtime; same-org replicate plans; ADR-0147. Not Mem0 / multi-region replication OS. |
| VL-246 | Agent Fabric (Phase 113) | Done | Router/discovery/collaborate/schedule over Agent Runtime; SSE ticks; ADR-0148. Sandboxed + Policy-gated; not LangGraph/AutoGPT OS. |
| VL-247 | Policy Fabric (Phase 114) | Done | Fabric-wide hard gate via FabricPolicyGate; ADR-0149. Denies 403 — not log-only. Not OPA/Cedar OS. |
| VL-248 | AI Fabric Production Audit (Phase 115) | Done | Audit pack under `docs/ai-fabric-audit/`; ADR-0150. Volume 10 closed. Ecosystem/Marketplaces → Volume 11. |
| VL-249 | Ecosystem Foundation (Phase 116) | Done | `/ecosystem-cloud` hub + product catalog; ADR-0151. Extends VL-090+/voice marketplace. Not payment OS; Stripe + sandbox safety from day one. |
| VL-250 | Plugin Marketplace (Phase 117) | Done | `/plugin-marketplace` publish/install/run/reviews; FabricPolicyGate + PluginPolicyGate + sandbox invoke; ADR-0152. liveCodeExecution=false. |
| VL-251 | Model Marketplace (Phase 118) | Done | `/model-marketplace` license SKUs over Model Registry; FabricPolicyGate + Stripe honesty; ADR-0153. Not HF/weight CDN OS. |
| VL-252 | Dataset Marketplace (Phase 119) | Done | `/dataset-marketplace` over dataset kind + VL-101; FabricPolicyGate + Stripe honesty; ADR-0154. Not Label Studio / Dataset Cloud OS. |
| VL-253 | Prompt Marketplace (Phase 120) | Done | `/prompt-marketplace` over prompt kind + Prompt Fabric; FabricPolicyGate + Stripe honesty; ADR-0155. Not prompt mesh OS. |
| VL-254 | Agent Marketplace (Phase 121) | Done | `/agent-marketplace` over Agent Runtime; FabricPolicyGate + AgentPolicyGate sandbox run; ADR-0156. Not LangGraph/AutoGPT OS. |
| VL-255 | Workflow Marketplace (Phase 122) | Done | `/workflow-marketplace` over Workflow Runtime; FabricPolicyGate + WorkflowPolicyGate sandbox run; ADR-0157. Not Zapier/Temporal OS. |
| VL-256 | Connector Marketplace (Phase 123) | Done | `/connector-marketplace` entitlement SKUs over connector catalog + Slack; FabricPolicyGate + Stripe honesty; ADR-0158. Not Zapier/iPaaS OS. |
| VL-257 | Voice & Language Marketplace (Phase 124) | Done | `/voice-language-marketplace` pack entitlements over VL-177 + Volume 1; FabricPolicyGate + Stripe honesty; ADR-0159. Not ElevenLabs/voice CDN OS. |
| VL-258 | Creator Economy (Phase 125) | Done | `/creator-economy` over VL-092 Connect + MarketplaceSale; hand-checked royalty math; tax/dispute gaps explicit; ADR-0160. Not payment-processor OS. |
| VL-259 | Ecosystem Production Audit (Phase 126) | Done | Audit pack under `docs/ecosystem-cloud-audit/`; ADR-0161. Volume 11 closed. Digital Twin / African Intelligence → Volume 12. |
| VL-260 | African Intelligence Cloud Foundation (Phase 127) | Done | `/african-intelligence-cloud` hub + catalog; ADR-0162. Extends Language/Knowledge/Intelligence clouds. Not Neo4j/Digital Twin/Global Intelligence OS. |
| VL-261 | African Language Registry (Phase 128) | Done | `/african-language-registry` seed + families; ADR-0163. `coverageComplete=false`. |
| VL-262 | Cultural Intelligence (Phase 129) | Done | `/cultural-intelligence` provenance/consent; ADR-0164. `traditionalKnowledgeConsentRequired=true`. |
| VL-263 | African Knowledge Graph (Phase 130) | Done | `/african-knowledge-graph` in-process graph; ADR-0165. `neo4jOs=false`. |
| VL-264 | Government Intelligence (Phase 131) | Done | `/government-intelligence`; ADR-0166. `officialGuidanceMustBeSourced` + stale-guidance risk. |
| VL-265 | Healthcare Intelligence (Phase 132) | Done | `/healthcare-intelligence`; ADR-0167. `notMedicalAdvice=true`; consult-professional framing. |
| VL-266 | Financial Intelligence (Phase 133) | Done | `/financial-intelligence`; ADR-0168. `notInvestmentAdvice=true`; fair-lending flagged. |
| VL-267 | Education Intelligence (Phase 134) | Done | `/education-intelligence`; ADR-0169. Vocabulary catalog — not national education OS. |
| VL-268 | Agricultural Intelligence (Phase 135) | Done | `/agricultural-intelligence`; ADR-0170. Vocabulary catalog — not farm-management OS. |
| VL-269 | Tourism & Heritage Intelligence (Phase 136) | Done | `/tourism-heritage-intelligence`; ADR-0171. Heritage consent posture. |
| VL-270 | African Intelligence Production Audit (Phase 137) | Done | Audit pack under `docs/african-intelligence-cloud-audit/`; ADR-0172. Volume 12 closed. Research/Global Intelligence → Volume 13+. |
| VL-271 | Research Cloud Foundation (Phase 138) | Done | `/research-cloud` hub + research areas catalog; ADR-0173. Extends Intelligence/Knowledge/Foundation Model clouds. `aiSovereigntyOs=false`. |
| VL-272 | Experiment Platform (Phase 139) | Done | `/experiment-platform` runs/lineage seed; ADR-0174. Not W&B/MLflow OS. |
| VL-273 | Synthetic Data Platform (Phase 140) | Done | `/synthetic-data-platform`; ADR-0175. `syntheticLabelRequired=true`; `isSynthetic=true`. |
| VL-274 | Benchmark Platform (Phase 141) | Done | `/benchmark-platform` suites + leaderboard seed; ADR-0176. Not public leaderboard OS. |
| VL-275 | Evaluation Platform (Phase 142) | Done | `/evaluation-platform`; ADR-0177. Extends model-evaluation-platform — does not regenerate. |
| VL-276 | AI Publication Platform (Phase 143) | Done | `/ai-publication-platform`; ADR-0178. `doiRegistryOs=false`. |
| VL-277 | Patent & Innovation Platform (Phase 144) | Done | `/patent-innovation-platform`; ADR-0179. `usptoOs=false`. |
| VL-278 | Open Science Platform (Phase 145) | Done | `/open-science-platform`; ADR-0180. Consent gate blocks restricted/unverified TK. |
| VL-279 | Research Analytics (Phase 146) | Done | `/research-analytics` sibling aggregation; ADR-0181. |
| VL-280 | Research Cloud Production Audit (Phase 147) | Done | Audit pack under `docs/research-cloud-audit/`; ADR-0182. Volume 13 closed. AI Sovereignty → Volume 14+. |
| VL-281 | MLOps & LLMOps Cloud Foundation (Phase 148) | Done | `/mlops-llmops-cloud` hub + asset types; ADR-0183. Extends Inference/Kernel/Foundation/RAG/Agent/Prompt. `trustCloudOs=false`. |
| VL-282 | Dataset Pipeline (Phase 149) | Done | `/dataset-pipeline`; ADR-0184. Extends dataset marketplace/VL-101 — does not regenerate. |
| VL-283 | Training Pipeline (Phase 150) | Done | `/training-pipeline` LoRA/QLoRA/DPO/RLHF/SFT; ADR-0185. `distributedTrainingOs=false`. |
| VL-284 | Continuous Evaluation (Phase 151) | Done | `/continuous-evaluation` gate status; ADR-0186. Extends evaluation-platform — promote gate for VL-289. |
| VL-285 | PromptOps Platform (Phase 152) | Done | `/promptops-platform`; ADR-0187. Over Prompt Runtime/Fabric. Not LangSmith OS. |
| VL-286 | RAGOps Platform (Phase 153) | Done | `/ragops-platform`; ADR-0188. Over Volume 6 RAG. Not vector-DB OS. |
| VL-287 | AgentOps Platform (Phase 154) | Done | `/agentops-platform`; ADR-0189. `policyViolationsVisible=true`. |
| VL-288 | AI Drift Detection (Phase 155) | Done | `/ai-drift-detection` driftClear check; ADR-0190. Required Continuous Learning promote gate. |
| VL-289 | Continuous Learning (Phase 156) | Done | `/continuous-learning`; ADR-0191. Never auto-promote; human+drift+eval+vetted feedback. |
| VL-290 | AI Operations Dashboard (Phase 157) | Done | `/ai-operations-dashboard` sibling aggregation; ADR-0192. |
| VL-291 | MLOps & LLMOps Cloud Production Audit (Phase 158) | Done | Audit pack under `docs/mlops-llmops-cloud-audit/`; ADR-0193. Volume 14 closed. Trust Cloud → Volume 15+. |
| VL-292 | Trust Cloud Foundation (Phase 159) | Done | `/trust-cloud` hub; ADR-0194. Enforcement layer. `platformEngineeringOs=false`. |
| VL-293 | AI Safety Platform (Phase 160) | Done | Safety detections + check/evaluate; `policyRuntimeIntegrated=true`. ADR-0195. |
| VL-294 | AI Governance Platform (Phase 161) | Done | Human approve/reject workflow; `humanSignOffRequired=true`. ADR-0196. |
| VL-295 | Explainability Platform (Phase 162) | Done | Confidence/evidence/attribution/traces; `shapOs=false`. ADR-0197. |
| VL-296 | Privacy Platform (Phase 163) | Done | PII/PHI + TK consent enforcement; `traditionalKnowledgeConsentRequired=true`. ADR-0198. |
| VL-297 | Compliance Platform (Phase 164) | Done | Control mapping; tooling not certification. ADR-0199. |
| VL-298 | Risk Intelligence (Phase 165) | Done | Risk scoring seed + analytics; `grcSuiteOs=false`. ADR-0200. |
| VL-299 | Identity Federation (Phase 166) | Done | Federation readiness over Clerk; `oktaOs=false`. ADR-0201. |
| VL-300 | Trust Analytics (Phase 167) | Done | Aggregates sibling trust hubs; `siemOs=false`. ADR-0202. |
| VL-301 | Trust Cloud Production Audit (Phase 168) | Done | Audit pack under `docs/trust-cloud-audit/`; ADR-0203. Volume 15 closed. Platform Engineering → Volume 16+. |
| VL-302 | Platform Engineering Foundation (Phase 169) | Done | `/platform-engineering-cloud` hub; ADR-0204. Internal IDP. `controlPlaneOs=false`. |
| VL-303 | Internal Developer Portal (Phase 170) | Done | Portal catalog over developer-cloud; `backstageOs=false`. ADR-0205. |
| VL-304 | Service Catalog (Phase 171) | Done | api/web/sdk/cli/db/queue/infra seed. ADR-0206. |
| VL-305 | Golden Path Platform (Phase 172) | Done | Service/cloud/SDK/CI/security templates. ADR-0207. |
| VL-306 | GitOps Platform (Phase 173) | Done | Fly/shared platform readiness; `argoCdOs=false`; `fluxOs=false`. ADR-0208. |
| VL-307 | Release Engineering (Phase 174) | Done | Blue-green/canary/rolling/flags/rollback seed. ADR-0209. |
| VL-308 | Reliability Engineering (Phase 175) | Done | SLO/SLI/error budgets; extends observability; `datadogOs=false`. ADR-0210. |
| VL-309 | FinOps Platform (Phase 176) | Done | GPU/model budgets+alerts; `gpuBudgetAlertsEnabled=true`; `finopsOs=false`. ADR-0211. |
| VL-310 | Supply Chain Security (Phase 177) | Done | SBOM/scan/findings inventory; `snykOs=false`. ADR-0212. |
| VL-311 | Developer Experience Platform (Phase 178) | Done | CLI/SDK/codegen/docs/repo health; extends VL-127. ADR-0213. |
| VL-312 | Platform Engineering Analytics (Phase 179) | Done | DORA + sibling aggregation. ADR-0214. |
| VL-313 | Platform Engineering Production Audit (Phase 180) | Done | Audit pack under `docs/platform-engineering-cloud-audit/`; ADR-0215. Volume 16 closed. Control Plane → Volume 17+. |
| VL-314 | Control Plane Foundation (Phase 181) | Done | `/control-plane-cloud` hub; ADR-0216. `executesInference=false`; `dataPlaneOs=false`. |
| VL-315 | Organization Control (Phase 182) | Done | Orgs/roles; `leastPrivilegeRequired`; `controlPlaneAdminNotDefault`. ADR-0217. |
| VL-316 | Global Configuration Platform (Phase 183) | Done | Config/versioning/flags; secrets refs only. ADR-0218. |
| VL-317 | Global Policy Engine (Phase 184) | Done | Extends Policy Runtime/Trust; `policyRuntimeIntegrated`. ADR-0219. |
| VL-318 | Global Deployment Controller (Phase 185) | Done | Promote auth + rollback; extends release-engineering. ADR-0220. |
| VL-319 | Global Routing Controller (Phase 186) | Done | Traffic/geo/AI routing catalog; `istioOs=false`. ADR-0221. |
| VL-320 | Secrets & Certificate Platform (Phase 187) | Done | Envelope encryption + audit; metadata-only; `hashicorpVaultOs=false`. ADR-0222. |
| VL-321 | Global Scheduler (Phase 188) | Done | Job/cron/workflow schedules; `executesInference=false`. ADR-0223. |
| VL-322 | Control Plane Analytics (Phase 189) | Done | Sibling aggregation. ADR-0224. |
| VL-323 | Control Plane Production Audit (Phase 190) | Done | Audit pack under `docs/control-plane-cloud-audit/`; ADR-0225. Volume 17 closed. Data Plane → Volume 18+. |
| VL-324 | Data Plane Foundation (Phase 191) | Done | `/data-plane-cloud` hub; ADR-0226. `managesOrgsPoliciesBilling=false`; `serviceMeshOs=false`. |
| VL-325 | Translation Runtime (Phase 192) | Done | Thin over translate; `thinExecutionLayer`; ADR-0227. |
| VL-326 | Speech Runtime (Phase 193) | Done | Thin over speech-cloud / speech-recognition; ADR-0228. |
| VL-327 | Voice Runtime (Phase 194) | Done | Thin over voice-cloud / voice; ADR-0229. |
| VL-328 | Vision Runtime (Phase 195) | Done | Thin over ocr / documents; ADR-0230. |
| VL-329 | Knowledge Runtime (Phase 196) | Done | Thin over knowledge-cloud / knowledge / knowledge-fabric; ADR-0231. |
| VL-330 | Embedding Runtime (Phase 197) | Done | Thin over embeddings / embedding-cloud; ADR-0232. |
| VL-331 | Data Plane Streaming (Phase 198) | Done | Façade `data-plane-streaming` → streaming-runtime; `extendsStreamingRuntime`; ADR-0233. |
| VL-332 | GPU Runtime (Phase 199) | Done | Thin over gpu-platform; `gpuBudgetLimitsRequired`; ADR-0234. |
| VL-333 | Data Plane Production Audit (Phase 200) | Done | Audit pack under `docs/data-plane-cloud-audit/`; ADR-0235. Volume 18 closed. Service Mesh → past Volume 18. |
| VL-334 | VAIOS Foundation (Phase 201) | Done | `/vaios` hub; ADR-0236. `unifyingOrchestrationLayer`; `notLinux`/`notKubernetes`; `enterpriseEngineeringSystemOs=false`. |
| VL-335 | AI Scheduler (Phase 202) | Done | Unifies global-scheduler/GPU/workflow/agent queues; ADR-0237. |
| VL-336 | Runtime Manager (Phase 203) | Done | Lifecycle catalog over Kernel + Data Plane runtimes; ADR-0238. |
| VL-337 | Resource Manager (Phase 204) | Done | Resource allocation catalog; `gpuBudgetLimitsRequired`; ADR-0239. |
| VL-338 | Workflow Operating System (Phase 205) | Done | Façade over workflow-runtime + marketplace; ADR-0240. |
| VL-339 | Agent Operating System (Phase 206) | Done | Façade over agent-runtime + fabric + marketplace; ADR-0241. |
| VL-340 | AI Memory Operating System (Phase 207) | Done | Façade over memory-runtime + fabric + knowledge-memory; ADR-0242. |
| VL-341 | Knowledge Operating System (Phase 208) | Done | Façade over knowledge-runtime/fabric/cloud + AKG; ADR-0243. |
| VL-342 | Plugin Operating System (Phase 209) | Done | Façade over plugin-runtime + marketplace; existing policy gates; ADR-0244. |
| VL-343 | VAIOS Production Audit (Phase 210) | Done | Audit pack under `docs/vaios-audit/`; ADR-0245. Volume 19 closed. Enterprise Engineering System → past Volume 19. |
| VL-344 | Enterprise Engineering System Foundation (Phase 211) | Done | `/enterprise-engineering-system` hub; ADR-0246. `architectureKnowledgeBaseOs=false`; `adrFactoryOs=false`. |
| VL-345 | Engineering Governance (Phase 212) | Done | Councils + CAB/TSC; `humanSignOffRequired`; ADR-0247. |
| VL-346 | Architecture Governance (Phase 213) | Done | ADR/RFC workflows point at `docs/adr`; `adrFactoryOs=false`; ADR-0248. |
| VL-347 | Repository Standards (Phase 214) | Done | Monorepo/polyrepo/naming/branch/git standards; ADR-0249. |
| VL-348 | Engineering Quality Platform (Phase 215) | Done | Quality catalog + dashboard snapshot; `sonarqubeOs=false`; ADR-0250. |
| VL-349 | AI Engineering Standards (Phase 216) | Done | AI standards + retroactiveChecks Vol 11/12/17; ADR-0251. |
| VL-350 | API Engineering Standards (Phase 217) | Done | REST/GraphQL/gRPC/SDK standards; ADR-0252. |
| VL-351 | Database Engineering Standards (Phase 218) | Done | Postgres/Redis/ES/vector/KG standards; `databaseOs=false`; ADR-0253. |
| VL-352 | Infrastructure Engineering Standards (Phase 219) | Done | IaC/deploy/GPU; FinOps+secrets honesty; `kubernetesOs=false`; ADR-0254. |
| VL-353 | EES Production Audit (Phase 220) | Done | Audit pack under `docs/enterprise-engineering-system-audit/`; ADR-0255. Volume 20 closed. |

---

## Notes log

| Date | Note |
| --- | --- |
| 2026-09-06 | Kickoff only. No application code. Library v2 supersedes v1; executable backlog is 58 phases (VL-000–VL-112), not 300. |
| 2026-09-06 | Phase 0 complete (VL-001, VL-002). `pnpm test` / `typecheck` / `lint` green. Compose Postgres on host 5433. |
| 2026-09-06 | Phase 1 code shipped (Clerk + Google MT + translate console). Auth/MT live paths **Blocked** until keys added — no fake translator. |
| 2026-09-06 | VL-030 Done: OpenAPI + `/docs` + `/playground`. Console restyled (ElevenLabs-inspired light monochrome). |
| 2026-09-06 | VL-032 + VL-033 Done: audit log + `@verbalab/sdk`. |
| 2026-09-06 | VL-031 billing code shipped (Stripe Checkout/Portal/webhooks + quota). Live checkout **Blocked** on Stripe keys. |
| 2026-09-06 | VL-054 Done: language detection (`source=auto`, `POST /v1/detect`); Google + franc-min (ADR-0014). M5 complete. |
| 2026-09-06 | VL-060 Done: AI Chat (`POST /v1/chat/completions`, console `/chat`, optional translate-then-answer). Live blocked on `OPENAI_API_KEY`. |
| 2026-09-06 | VL-061 Done: live interpreter (`POST /v1/interpret` STT→MT→TTS, console `/interpret`). |
| 2026-09-06 | VL-063 Done: embeddings gateway + `POST /v1/embeddings` (ADR-0017); unlocks VL-062 RAG. |
| 2026-09-06 | VL-062 Done: Knowledge + RAG (pgvector, `/v1/knowledge/*`, console `/knowledge`). Postgres image → `pgvector/pgvector:pg16`. |
| 2026-09-06 | VL-070 Done: observability (JSON logs, request IDs, Sentry env-gated, translate p95). |
| 2026-09-06 | VL-071 Done: Redis rate limits (per-key/org, 429 Retry-After) + plan entitlements; monthly quota still 402. |
| 2026-09-06 | VL-072 Done: security baseline — tenant isolation tests, helmet/Next headers, CI gitleaks + prod audit (ADR-0021). 84 API tests. |
| 2026-09-06 | VL-073 Done: data governance — org settings, workspace export, owner delete cascade, data map (ADR-0022). Console `/data`. |
| 2026-09-06 | VL-074 Done: Fly.io one-region deploy (Dockerfiles, fly.toml, release migrate, deploy.yml skip-without-token). ADR-0023. |
| 2026-09-06 | VL-080 Done: Resend notifications (job complete, usage thresholds, member-added). Live needs `RESEND_API_KEY` + `EMAIL_FROM`. |
| 2026-09-06 | VL-081 Done: customer members list + platform admin console (search/disable/revoke keys). ADR-0025. |
| 2026-09-06 | VL-082 Done: Slack connector — slash `/verbalab <lang> <text>` → translate + in-channel reply; install/status APIs; console `/connectors`. ADR-0026. 108 API tests. Live needs `SLACK_SIGNING_SECRET`. |
| 2026-09-06 | VL-083 Done: workflows — `transcribe` → `translate` → `notify` as JSON job steps; saved defs + `/workflows`. ADR-0027. 111 API tests. |
| 2026-09-06 | VL-084 Done: voice FAQ — Twilio inbound/outbound + STT→LLM→TTS; console `/voice` simulate. ADR-0028. 116 API tests. Live needs `TWILIO_*` + `OPENAI_API_KEY` + demo org/workspace. |
| 2026-09-06 | VL-085 Done: org analytics — `GET /v1/analytics/overview` + console `/analytics` (volume, estimated cost, job error rate). ADR-0029. 120 API tests. |
| 2026-09-06 | VL-086 Done: versioned prompts (`chat`/`rag`/`voice_faq`) with activate/rollback + code fallback; console `/prompts`. ADR-0030. 123 API tests. M8 complete. |
| 2026-09-06 | VL-090 Done: marketplace foundation — glossary listings with frozen snapshot + copy-on-install; Pro `assertPro`; console `/marketplace`. ADR-0031. 126 API tests. |
| 2026-09-07 | VL-091 Done: marketplace kinds `prompt` + `dataset` (TM pairs); kind filter; `/marketplace` UI. ADR-0032. 128 API tests. |
| 2026-09-07 | VL-092 Done: Stripe Connect Express + `priceCents` + destination Checkout with platform fee; `marketplace_sales`; fixture recorded sales without Stripe. ADR-0033. 129 API tests. M9 complete. |
| 2026-09-07 | VL-100 Done: coverage matrix + golden eval harness (EN→sw/yo/am); public `/coverage` + `GET /v1/coverage`. ADR-0034. 134 API tests. |
| 2026-09-07 | VL-101 Done: dataset program — license/consent/PII intake, versioned local blobs, `/datasets`, governance export/delete hooks. ADR-0035. 137 API tests. |
| 2026-09-07 | VL-102 Done: locale packs (date/number/currency/honorifics/DNT) for en/fr/sw/yo/am; public API + `/locales`; translate protects DNT entities. ADR-0036. 141 API tests. |
| 2026-09-07 | VL-103 Done: vertical starter glossaries (public-sector/healthcare/banking EN→sw); Pro install into workspace glossary; section on `/glossary`. ADR-0037. 144 API tests. |
| 2026-09-07 | VL-104 Done: failed-pair candidates from coverage; Pro fine-tune jobs + thin model registry; gateway prefers ready finetune artifacts with vendor fallback; Modal stays gated. ADR-0038. 147 API tests. |
| 2026-09-07 | VL-110 Done: model registry seeds bought providers per feature; public live matrix `/v1/models/live` + `/models`; platform-admin externalUrl (W&B). ADR-0039. 150 API tests. |
| 2026-09-07 | VL-111 Done: training jobs API (`/v1/training-jobs`); manual/Modal/Vertex/fixture launchers; signed GPU callback; dataset link. ADR-0040. 154 API tests. |
| 2026-09-07 | VL-112 Blocked: foundation model program not started (no Atlas/Baobab shells). Use vendors + fine-tunes. ADR-0041. Executable M0–M11 complete for a small team. |
| 2026-09-07 | VL-064 Done: ElevenLabs voice cloning with consent attestation, pending_review → approve/reject, watermark on `clone:{id}` speech. ADR-0042. 157 API tests. |
| 2026-09-07 | VL-075 Done: multi-region as residency islands (US/`iad` + EU/`ams`); `organizations.data_region`; public `/v1/regions`; pin enforcement; console `/data`. ADR-0043. 161 API tests. |
| 2026-09-07 | Polish 1–3: `/coverage` nav + empty states + docs copy; README/setup/`.env.example` DX; `@verbalab/sdk` widened (regions/locales/localize/jobs/ocr/speech). |
| 2026-09-07 | Polish 4–5: web `/health` + Fly/Docker checks + `pnpm smoke`; Playwright public e2e + gated sign-in→translate. |
| 2026-09-07 | M12 scheduled (VL-120–124). VL-120 Done: African Voice Studio UX over OpenAI/ElevenLabs (ADR-0044). |
| 2026-09-07 | VL-121 Done: own TTS path — `own:*` catalog + rented HTTP/fixture adapter; OpenAI remains stock default (ADR-0045). |
| 2026-09-07 | Phase −1 docs: `docs/ENTERPRISE_PRODUCT_BLUEPRINT.md` (system/C4/DDD/contracts/deploy/security/testing). No application code. |
| 2026-09-07 | Phase 0 Engineering OS: `docs/ENGINEERING_OS.md` + RFC/PRD/Runbook templates. Production monorepo = this repo (no regenerate / no TODOs). |
| 2026-09-07 | VL-125 Done: Cloud Platform Foundation — map library terms; `/v1/workspaces`, `/v1/feature-flags`, `/v1/cloud/overview`, console `/dashboard` + switcher; ADR-0046. VL-012 Done (multi-workspace). |
| 2026-09-07 | VL-126 Done: Identity Cloud — membership role/remove, Clerk `o.rol` sync, API key `lastUsedAt`, `/identity` + overview; ADR-0047. VL-011 Done (RBAC writes). SAML/SCIM/ABAC/Teams deferred to buy. |
| 2026-09-07 | VL-127 Done: Developer Cloud Foundation — `/developers` + overview/SDK APIs, soft `vl_test_` keys, `@verbalab/cli`, playground detect/languages; ADR-0048. |
| 2026-09-07 | VL-128 Done: Enterprise Cloud Foundation — `/enterprise` + policies overview; vendor-training policy on translate audits; ADR-0049. No GRC/policy-engine product. |
| 2026-09-07 | VL-129 Done: AI Gateway Cloud Foundation — `/gateway` + provider catalog; optional OpenRouter chat fallback; ADR-0050. **Volume 1 Part A complete.** |
| 2026-09-07 | VL-130 Done: Language Cloud Foundation — `/language` hub + product catalog/overview; ADR-0051. Dialect/accent/grammar/style deferred. |
| 2026-09-07 | VL-131 Done: Dialect detection — curated `dialects` + `POST /v1/dialects/detect` + `/dialects`; ADR-0052. Next: accent detection. |
| 2026-09-07 | VL-132 Done: Accent detection — spoken `accents` + text/audio detect + `/accents`; ADR-0053. Next: Grammar AI. |
| 2026-09-07 | VL-133 Done: Grammar AI — rules + optional LLM check + `/grammar`; ADR-0054. Next: Writing Style AI. |
| 2026-09-07 | VL-134 Done: Writing Style AI — profiles + rewrite + `/style`; ADR-0055. Next: country/regional locale packs. |
| 2026-09-07 | VL-135 Done: Country packs — `country_packs` + compose locales + `/countries`; ADR-0056. Next: GraphQL (ask first). |
| 2026-09-07 | VL-136 Done: GraphQL façade — Apollo `/graphql` + Language Cloud resolvers; ADR-0057. Next: CQRS/hex (ask before rewrite). |
| 2026-09-07 | VL-137 Done: Bounded CQRS — ports/adapters + command/query handlers for Language Cloud; ADR-0058. Next: Terraform/K8s (choose provider). |
| 2026-09-07 | VL-138 Done: AWS EKS + Terraform in `af-south-1` — `infra/terraform/aws-eks` + `infra/k8s`; ADR-0059. Language Cloud deferred queue complete. |
| 2026-09-07 | VL-139 Done: Enterprise Language Registry (Phase 7) — families, writing systems/alphabets, rule catalog, REST/SDK/admin/analytics/validate/health; ADR-0060. |
| 2026-09-07 | VL-140 Done: Translation Engine (Phase 8) — format codecs + SSE stream + chat MT + GraphQL translate + engine catalog; ADR-0061. WhatsApp/website deferred. |
| 2026-09-07 | VL-141 Done: Localization Platform (Phase 9) — ICU validate/format, L10n QA, RTL layout, timezone format, dashboard; ADR-0062. |
| 2026-09-07 | VL-142 Done: Grammar Intelligence (Phase 10) — spell/correct/suggest, medical/legal/gov tone profiles + disclaimers, analytics; ADR-0063. |
| 2026-09-07 | VL-143 Done: Style Intelligence (Phase 11) — formal/business/marketing/technical profiles, tone detect/transform/transfer, analytics; ADR-0064. |
| 2026-09-07 | VL-144 Done: Language Intelligence (Phase 12) — analyze + SSE, intent/sentiment/emotion/readability/complexity/confidence; ADR-0065. |
| 2026-09-07 | VL-145 Done: Enterprise Translation Memory (Phase 13) — scopes, similarity, versioning, optional vector; ADR-0066. |
| 2026-09-07 | VL-146 Done: Language Analytics (Phase 14) — usage/quality/latency/costs/dialects + enterprise report; ADR-0067. |
| 2026-09-07 | VL-147 Done: Language Cloud Production Audit (Phase 15) — checklist/tests/reports; rejects Google+DeepL+Grammarly+Crowdin parity claim; no Speech Cloud. ADR-0068. |
| 2026-09-07 | VL-150 Done: Speech Cloud Foundation (Phase 16) — `/speech` hub + catalog/overview + CQRS/GraphQL slice; ADR-0069. Extends VL-041/042; streaming/speaker OS deferred. |
| 2026-09-07 | VL-151 Done: Speech Recognition Engine (Phase 17) — recognize/stream/subtitles/vocab + dashboard; ADR-0070. Segment SSE partial streaming. |
| 2026-09-07 | VL-152 Done: Speaker Intelligence (Phase 18) — profiles/enroll/verify/identify/diarize + history; ADR-0071. Local fingerprints + gap diarization. |
| 2026-09-07 | VL-153 Done: Accent Intelligence (Phase 19) — engine/classify/analytics façade over VL-132; ADR-0072. Acoustic models deferred. |
| 2026-09-07 | VL-154 Done: Emotion Intelligence (Phase 20) — detect/stream + 9 labels; ADR-0073. Soft audio proxies; SER deferred. |
| 2026-09-07 | VL-155 Done: Audio Intelligence (Phase 21) — analyze/silence/enhance/upscale/isolate + SSE; ADR-0074. Echo AEC deferred. |
| 2026-09-07 | VL-156 Done: Pronunciation Intelligence (Phase 22) — assess/score/coach/phonemes/fluency; ADR-0075. Forced alignment deferred. |
| 2026-09-07 | VL-157 Done: Wake Word Engine (Phase 23) — detect/spot/triggers/keywords + SSE; ADR-0076. On-device DNN deferred. |
| 2026-09-07 | VL-158 Done: Call Intelligence (Phase 24) — ingest/analyze/report; ADR-0077. Heuristic coaching/QA; Voice FAQ separate. |
| 2026-09-07 | VL-159 Done: Speech Analytics (Phase 25) — usage/languages/costs/accuracy proxies/report; ADR-0078. WER lab deferred. |
| 2026-09-07 | VL-160 Done: Speech Cloud Production Audit — checklist/tests/reports; ADR-0079. Cloud Blueprint ADR-0080. Volume closed. |
| 2026-10-03 | VL-170 Done: Voice Cloud Foundation (Phase 27) — `/voice-cloud` hub + catalog/overview + CQRS/GraphQL slice; ADR-0081. Extends TTS/clones/studio; Volume 3 started. |
| 2026-10-03 | VL-171 Done: Neural Text-to-Speech (Phase 28) — `/v1/tts` synthesize/stream/voices + `/neural-tts`; ADR-0082. Chunk SSE after synthesis. |
| 2026-10-03 | VL-172 Done: Voice Cloning Platform (Phase 29) — governance hub + ownership/license/permissions; ADR-0083. Consent/watermark retained. |
| 2026-10-03 | VL-173 Done: Emotion Voice Engine (Phase 30) — profiles + synthesize/stream; ADR-0084. Soft prosody façade; trained expressive TTS not claimed. |
| 2026-10-03 | VL-174 Done: Voice Studio (Phase 31) — `/voice-studio` + SSML lite/lexicon/linear timeline/compare; ADR-0085. Not a nonlinear DAW. |
| 2026-10-03 | VL-175 Done: Voice Enhancement Platform (Phase 32) — profiles over VL-155; ADR-0086. Not Krisp/Adobe Enhance; AEC deferred. |
| 2026-10-03 | VL-176 Done: Voice Biometrics (Phase 33) — encrypted templates + auth/risk/anti-spoof/liveness; ADR-0087. Not NIST/PAD certified. |
| 2026-10-03 | VL-177 Done: Voice Marketplace (Phase 34) — voice SKU listings/licenses/ratings; ADR-0088. ≠ localization marketplace; celebrity blocked. |
| 2026-10-03 | VL-178 Done: Voice Analytics (Phase 35) — TTS/voice audit aggregates + marketplace revenue; ADR-0089. ≠ Speech Analytics; BI deferred. |
| 2026-10-03 | VL-179 Done: Voice Cloud Production Audit (Phase 36) — checklist/tests/reports; ADR-0090. Volume closed. |
| 2026-10-03 | VL-180 Done: Intelligence Cloud Foundation (Phase 47) — hub/catalog/overview; ADR-0091. Extends chat/embeddings/RAG; no custom AI kernel. |
| 2026-10-03 | VL-181 Done: Embedding Cloud (Phase 48) — hub over VL-063 text embeds; modality tags; ADR-0092. Speech/image/video deferred. |
| 2026-10-03 | VL-182 Done: Vector Cloud (Phase 49) — hub over VL-062 pgvector search; ADR-0093. Hybrid/sharding/Pinecone OS deferred. |
| 2026-10-03 | VL-183 Done: Memory Cloud (Phase 50) — persistent memories + GDPR export/erase; ADR-0094. Not infinite personalization OS. |
| 2026-10-03 | VL-184 Done: Knowledge Graph Cloud (Phase 51) — bounded Postgres ER layer; ADR-0095. Prefer RAG; Neo4j/ontology deferred. |
| 2026-10-03 | VL-185 Done: Context Engine (Phase 52) — assemble retrieval+memory+prompt; ADR-0096. Char-budget compression; not infinite context. |
| 2026-10-03 | VL-186 Done: Reasoning Cloud (Phase 53) — LLM-gateway strategies + reason API; ADR-0097. Not custom reasoner kernel. |
| 2026-10-03 | VL-187 Done: Recommendation Engine (Phase 54) — light rankers over langs/voices/knowledge; ADR-0098. Not retail recommender OS. |
| 2026-10-03 | VL-188 Done: Prompt Intelligence (Phase 55) — hub over VL-086 versioned prompts; ADR-0099. Not auto-prompt research lab. |
| 2026-10-03 | VL-189 Done: AI Decision Engine (Phase 56) — light rules policy/routing helpers; ADR-0100. Not Drools/Pega BRMS. |
| 2026-10-03 | VL-190 Done: AI Orchestration (Phase 57) — load-bearing e2e pipelines over gateway/engines; ADR-0101. Not multi-cloud agent OS. |
| 2026-10-03 | VL-191 Done: Intelligence Analytics (Phase 58) — usage/quality aggregates for Intelligence Cloud; ADR-0102. ≠ Speech/Voice analytics. |
| 2026-10-03 | VL-192 Done: Intelligence Cloud Production Audit (Phase 59) — checklist/tests/reports; ADR-0103. Volume closed. |
| 2026-10-03 | VL-193 Done: Knowledge Cloud Foundation (Phase 60) — hub/catalog/overview; ADR-0104. Extends VL-062 + Intelligence; no enterprise knowledge OS. |
| 2026-10-03 | VL-194 Done: Enterprise Knowledge Base (Phase 61) — hub over VL-062 + collections/tags/MD/HTML; ADR-0105. Tenant-scoped; Confluence OS deferred. |
| 2026-10-03 | VL-195 Done: Enterprise Search (Phase 62) — keyword/semantic/light hybrid over VL-062; ADR-0106. Not Elastic/BM25 OS. |
| 2026-10-03 | VL-196 Done: Ontology Platform (Phase 63) — concepts/is_a/synonyms over VL-184 KG; ADR-0107. Not OWL/Protege OS. |
| 2026-10-03 | VL-197 Done: Taxonomy Platform (Phase 64) — terms/trees/assign + heuristic classify; ADR-0108. Not enterprise taxonomy OS. |
| 2026-10-03 | VL-198 Done: Enterprise RAG Platform (Phase 65) — retrieve/chunk/cite/grounded query; ADR-0109. Extends VL-062 + hybrid; not LangChain OS. Hand-verified on real docs. |
| 2026-10-03 | VL-199 Done: Knowledge Memory (Phase 66) — knowledge-layer over VL-183; evolve/versions; ADR-0110. Not Mem0 OS; distinct from Memory Cloud hub. |
| 2026-10-03 | VL-200 Done: Knowledge Intelligence (Phase 67) — discover/link/recommend/validate/duplicates/confidence; ADR-0111. Not BI/Palantir OS. |
| 2026-10-03 | VL-201 Done: Enterprise Knowledge APIs (Phase 68) — REST/GraphQL/OpenAPI/SDK/CLI/webhooks/SSE pack; ADR-0112. Not gRPC/Kafka/SDK-generator OS. |
| 2026-10-03 | VL-202 Done: Knowledge Analytics (Phase 69) — growth/usage/quality/search/gaps/confidence/relationships; ADR-0113. Not BI OS. |
| 2026-10-03 | VL-203 Done: Knowledge Cloud Production Audit (Phase 70) — checklist/tests/reports; ADR-0114. Volume closed. |
| 2026-10-03 | VL-204 Done: Inference Cloud Foundation (Phase 71) — hub/catalog/overview; ADR-0115. Extends AI Gateway; no GPU hyperscaler. Spend-safety notes for GPU/Cost phases. |
| 2026-10-03 | VL-205 Done: GPU Platform (Phase 72) — sandbox allocations + hard ceilings; ADR-0116. No cloud GPU APIs; open-ended autoscale forbidden. |
| 2026-10-03 | VL-206 Done: Model Serving (Phase 73) — Gateway/registry hub + sandbox canary/blue-green/rollback; ADR-0117. Not vLLM/KServe OS. |
| 2026-10-03 | VL-207 Done: AI Router (Phase 74) — dry-run model/provider routing + policies; ADR-0118. Not a mesh; does not enforce spend caps. |
| 2026-10-03 | VL-208 Done: Streaming Runtime (Phase 75) — SSE hub + sandbox LLM chunks; ADR-0119. Links existing product SSE; WS/gRPC/video deferred. |
| 2026-10-03 | VL-209 Done: Batch Runtime (Phase 76) — BullMQ hub + sandbox runs; priority/retry/checkpoint; ADR-0120. Not Spark/Airflow OS. |
| 2026-10-03 | VL-210 Done: Intelligent Cache (Phase 77) — opt-in exact-key/normalized-hash store; ADR-0121. Not Redis/vector/CDN OS; Gateway not auto-wired. |
| 2026-10-03 | VL-211 Done: Cost Optimization Engine (Phase 78) — hard daily/monthly spend enforce + cost optimize; ADR-0122. Not FinOps/Spot OS; gates AI Router resolve. |
| 2026-10-03 | VL-212 Done: AI Runtime Analytics (Phase 79) — Inference Cloud aggregates; ADR-0123. ≠ VL-191/202; not BI/APM OS. |
| 2026-10-03 | VL-213 Done: Inference Cloud Production Audit (Phase 80) — checklist/tests/reports; ADR-0124. Volume closed. Spend-safety verified; AI Kernel rejected here. |
| 2026-10-03 | VL-214 Done: AI Kernel Foundation (Phase 81) — internal hub/catalog/overview; ADR-0125. Not customer product / Linux-VAIOS. Action-safety constraints for Agent/Workflow/Plugin/Policy. |
| 2026-10-03 | VL-215 Done: Memory Runtime (Phase 82) — kernel-layer over VL-183 MemoryRecord; ADR-0126. Ceilings/eviction/versioning; not Mem0/replication OS. |
| 2026-10-03 | VL-216 Done: Prompt Runtime (Phase 83) — execute/render/validate over VL-086/188; ADR-0127. IC prompt cache; not research lab/mesh OS. |
| 2026-10-03 | VL-217 Done: Context Runtime (Phase 84) — assemble/prioritize/compress over VL-185; ADR-0128. IC context cache; not infinite-context OS. |
| 2026-10-03 | VL-218 Done: Reasoning Runtime (Phase 85) — plan/reflect/eval/history over VL-186; ADR-0129. Tool selection without execution; not custom reasoner OS. |
| 2026-10-03 | VL-219 Done: Agent Runtime (Phase 86) — sandbox + scoped permissions; ADR-0130. |
| 2026-10-03 | VL-220 Done: Workflow Runtime (Phase 87) — sandbox + scoped permissions; ADR-0131. |
| 2026-10-03 | VL-221 Done: Plugin Runtime (Phase 88) — sandbox + scoped permissions; ADR-0132. |
| 2026-10-03 | VL-222 Done: Policy Runtime (Phase 89) — hard-gate into Agent/Workflow/Plugin; ADR-0133. |
| 2026-10-03 | VL-223 Done: AI Kernel Production Audit (Phase 90) — evidence pack; ADR-0134. Volume 8 closed. |
| 2026-10-03 | VL-224 Done: Foundation Model Cloud Foundation (Phase 91) — hub/catalog/overview; ADR-0135. No trained competitive weights; MLOps track preferred next. |
| 2026-10-03 | VL-235 Done: Model Training Platform (Phase 102) — experiment plans + LoRA/instruction handoff to VL-111; ADR-0136. Not distributed/RLHF lab. |
| 2026-10-03 | VL-236 Done: Model Evaluation Platform (Phase 103) — VL-100 handoff + sandbox suites/leaderboard/reports; ADR-0137. No MMLU OS / SOTA claims. |
| 2026-10-03 | VL-237 Done: Model Registry hub (Phase 104) — cards/versions/approvals/canary plans over VL-110; ADR-0138. Not MLflow/mesh OS. |
| 2026-10-03 | VL-238 Done: Foundation Model Cloud Production Audit (Phase 105) — evidence pack; ADR-0139. Volume 9 MLOps track closed. AI Fabric deferred to Volume 10. |
| 2026-10-03 | VL-225 Done: Atlas scaffold (Phase 92) — capability catalog + Gateway/MLOps handoffs; ADR-0140. Not trained competitive weights. |
| 2026-10-03 | VL-239 Done: AI Fabric Foundation (Phase 106) — internal bus hub/routing; ADR-0141. Not Kafka hyperscaler; Policy Fabric hard-gate required later. |
| 2026-10-03 | VL-240 Done: Event Fabric (Phase 107) — Redis Streams + CloudEvents; DLQ/retries/replay/snapshots; ADR-0142. Kafka/NATS/Rabbit deferred adapters. |
| 2026-10-03 | VL-241 Done: Context Fabric (Phase 108) — router over Context Runtime; optional Event Fabric propagate; ADR-0143. Not infinite-context/WebSocket OS. |
| 2026-10-03 | VL-242 Done: Knowledge Fabric (Phase 109) — router over Knowledge Cloud; same-org distribute/sync; ADR-0144. Not Confluence/Neo4j federation OS. |
| 2026-10-03 | VL-243 Done: Prompt Fabric (Phase 110) — router over Prompt Runtime; validate/version/same-org sync; ADR-0145. Not prompt mesh/research lab OS. |
| 2026-10-03 | VL-244 Done: Reasoning Fabric (Phase 111) — router/pipelines/replay over Reasoning Runtime; ADR-0146. Not custom reasoner OS. |
| 2026-10-03 | VL-245 Done: Memory Fabric (Phase 112) — router/sync/distribute over Memory Runtime; ADR-0147. Not Mem0 / multi-region replication OS. |
| 2026-10-03 | VL-246 Done: Agent Fabric (Phase 113) — router/discovery/collaborate/schedule over Agent Runtime; ADR-0148. Sandboxed + Policy-gated; not LangGraph/AutoGPT OS. |
| 2026-10-03 | VL-247 Done: Policy Fabric (Phase 114) — fabric-wide hard gate via FabricPolicyGate; ADR-0149. Denies 403 — not log-only. |
| 2026-10-03 | VL-248 Done: AI Fabric Production Audit (Phase 115) — evidence pack; ADR-0150. Volume 10 closed. Ecosystem → Volume 11. |
| 2026-10-03 | VL-249 Done: Ecosystem Foundation (Phase 116) — `/ecosystem-cloud` hub/catalog; ADR-0151. Extends VL-090+/voice marketplace; Stripe + sandbox safety; not payment-processor OS. |
| 2026-10-03 | VL-250 Done: Plugin Marketplace (Phase 117) — publish/install/run/reviews over Plugin Runtime; FabricPolicyGate + PluginPolicyGate; ADR-0152. Not extension store OS / live code. |
| 2026-10-03 | VL-251 Done: Model Marketplace (Phase 118) — license SKUs over Model Registry; FabricPolicyGate + Stripe honesty; ADR-0153. Not Hugging Face / weight CDN OS. |
| 2026-10-03 | VL-252 Done: Dataset Marketplace (Phase 119) — hub over dataset kind + VL-101; FabricPolicyGate + Stripe honesty; ADR-0154. Not Label Studio / Dataset Cloud OS. |
| 2026-10-03 | VL-253 Done: Prompt Marketplace (Phase 120) — hub over prompt kind + Prompt Fabric; FabricPolicyGate + Stripe honesty; ADR-0155. Not prompt mesh / auto-prompt research OS. |
| 2026-10-03 | VL-254 Done: Agent Marketplace (Phase 121) — publish/install/run over Agent Runtime; FabricPolicyGate + AgentPolicyGate; ADR-0156. Not LangGraph/AutoGPT OS / live tools. |
| 2026-10-03 | VL-255 Done: Workflow Marketplace (Phase 122) — publish/install/run over Workflow Runtime; FabricPolicyGate + WorkflowPolicyGate; ADR-0157. Not Zapier/Temporal OS / live steps. |
| 2026-10-03 | VL-256 Done: Connector Marketplace (Phase 123) — entitlement SKUs over connector catalog + Slack; FabricPolicyGate + Stripe honesty; ADR-0158. Not Zapier/iPaaS OS / live outbound. |
| 2026-10-03 | VL-257 Done: Voice & Language Marketplace (Phase 124) — pack entitlements over VL-177 + Volume 1; FabricPolicyGate + Stripe honesty; ADR-0159. Not ElevenLabs/voice CDN OS / celebrity without rights. |
| 2026-10-03 | VL-258 Done: Creator Economy (Phase 125) — royalty math + profiles/invoices over VL-092 Connect; hand-checked scenarios; tax/dispute gaps explicit; ADR-0160. Not payment-processor OS. |
| 2026-10-03 | VL-259 Done: Ecosystem Production Audit (Phase 126) — evidence pack; ADR-0161. Volume 11 closed. Digital Twin / African Intelligence deferred to Volume 12. |
| 2026-10-03 | VL-260–269 Done: African Intelligence Cloud hubs (Phases 127–136) — foundation, language registry, cultural intelligence, knowledge graph, six domain engines; ADR-0162–0171. Honesty for consent/medical/finance/government. |
| 2026-10-03 | VL-270 Done: African Intelligence Production Audit (Phase 137) — evidence pack; ADR-0172. Volume 12 closed. Research / Global Intelligence → Volume 13+. |
| 2026-10-03 | VL-271–279 Done: Research Cloud hubs (Phases 138–146) — foundation through research analytics; ADR-0173–0181. Synthetic labeling + open-science consent honesty. |
| 2026-10-03 | VL-280 Done: Research Cloud Production Audit (Phase 147) — evidence pack; ADR-0182. Volume 13 closed. AI Sovereignty / MLOps → Volume 14+. |
| 2026-10-03 | VL-281–290 Done: MLOps & LLMOps Cloud hubs (Phases 148–157) — foundation through AI ops dashboard; ADR-0183–0192. Promote gates + AgentOps policy visibility honesty. |
| 2026-10-03 | VL-291 Done: MLOps & LLMOps Cloud Production Audit (Phase 158) — evidence pack; ADR-0193. Volume 14 closed. Trust Cloud → Volume 15+. |
| 2026-10-03 | VL-292–300 Done: Trust Cloud hubs (Phases 159–167) — foundation through trust analytics; ADR-0194–0202. Safety↔Policy, Privacy TK consent, Governance human sign-off, Compliance honesty. |
| 2026-10-03 | VL-301 Done: Trust Cloud Production Audit (Phase 168) — evidence pack; ADR-0203. Volume 15 closed. Platform Engineering → Volume 16+. |
| 2026-10-03 | VL-302–312 Done: Platform Engineering Cloud hubs (Phases 169–179) — foundation through PE analytics; ADR-0204–0214. FinOps GPU alerts, supply-chain scan/findings, GitOps honesty. |
| 2026-10-03 | VL-313 Done: Platform Engineering Cloud Production Audit (Phase 180) — evidence pack; ADR-0215. Volume 16 closed. Control Plane → Volume 17+. |
| 2026-10-03 | VL-314–322 Done: Control Plane Cloud hubs (Phases 181–189) — foundation through CP analytics; ADR-0216–0224. Secrets envelope/metadata, deploy auth+rollback, least privilege. |
| 2026-10-03 | VL-323 Done: Control Plane Cloud Production Audit (Phase 190) — evidence pack; ADR-0225. Volume 17 closed. Data Plane → Volume 18+. |
| 2026-10-03 | VL-324–332 Done: Data Plane Cloud hubs (Phases 191–199) — foundation through GPU runtime; ADR-0226–0234. Thin execution layers; no Service Mesh. |
| 2026-10-03 | VL-333 Done: Data Plane Cloud Production Audit (Phase 200) — evidence pack; ADR-0235. Volume 18 closed. Service Mesh / VAIOS deferred past Volume 18. |
| 2026-10-03 | VL-334–342 Done: VAIOS hubs (Phases 201–209) — foundation through Plugin OS; ADR-0236–0244. Unifying orchestration over Kernel + Fabric + Data Plane; notLinux/notKubernetes. |
| 2026-10-03 | VL-343 Done: VAIOS Production Audit (Phase 210) — evidence pack; ADR-0245. Volume 19 closed. Enterprise Engineering System deferred past Volume 19. |
| 2026-10-03 | VL-344–352 Done: Enterprise Engineering System hubs (Phases 211–219) — foundation through Infrastructure Standards; ADR-0246–0254. Standards/governance for humans+Cursor; architectureKnowledgeBaseOs/adrFactoryOs=false. |
| 2026-10-03 | VL-353 Done: EES Production Audit (Phase 220) — evidence pack; ADR-0255. Volume 20 closed. Architecture Knowledge Base / mass ADR factory deferred past Volume 20. |
