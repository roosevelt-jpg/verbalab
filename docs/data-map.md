# Lugemi data map (DPA annex)

Living inventory of personal / customer data processed by Lugemi AI. Update when new tables or vendors are added.

| Store / system | Purpose | Data categories | Retention | Processors / notes |
| --- | --- | --- | --- | --- |
| `organizations` | Tenant account, plan, governance flags | Org name, Stripe IDs, retention / persist / training flags, optional `data_region` residency pin | Until org delete | Lugemi DB for **that residency island** (US/EU are separate DBs; no cross-region replica) |
| `users` / `memberships` | Identity + RBAC | Clerk user id, email, name, role | User lifetime; membership cascades with org | Clerk (IdP) + Lugemi DB |
| `api_keys` | API auth | Key hash + prefix (secret shown once) | Until revoke / org delete | Lugemi DB |
| `usage_events` | Billing / usage / analytics | Meter type, quantity, period | Org policy / delete | Lugemi DB |
| `translation_requests` | Metering metadata + language-pair analytics | Langs, characters, provider, latency — **no source text** | Org policy / delete | Lugemi DB |
| `audit_events` | Security / compliance trail | Action, route, IP, key prefix, metadata | Org policy / delete | Lugemi DB |
| `glossary_terms` | Terminology | Source/target terms | Until delete | Lugemi DB |
| `translation_memory_entries` | Exact TM | Source/target segments | Until delete; blocked when `persistSourceText=false` | Lugemi DB |
| `translation_reviews` | Quality workflow | Source/target (or `[redacted]`), scores | Until delete | Lugemi DB |
| `jobs` | Async batch / documents / workflows | JSON input/result | Until delete | Lugemi DB + Redis/BullMQ |
| `workflows` | Saved step recipes | Name + JSON steps | Until delete | Lugemi DB |
| `prompts` / `prompt_versions` | Managed LLM system prompts | Key + versioned body | Until delete | Lugemi DB |
| `marketplace_listings` / `marketplace_installs` | Glossary / prompt / dataset pack catalog + install receipts | Title, description, price, frozen snapshot | Until delete | Lugemi DB |
| `marketplace_sales` | Creator payout ledger | Amount, platform fee, Stripe session id, status | Until delete | Lugemi DB + Stripe Connect |
| `dataset_assets` / `dataset_versions` + disk | Licensed corpus intake for fine-tunes | Title, license, consent notes, PII flag, partner, file bytes | Until archive / org delete | Lugemi DB + `DOCUMENT_STORAGE_DIR` |
| `locale_packs` | Cultural / locale notes per language | Date/number/currency notes, honorifics, do-not-translate entities | Product lifetime | Lugemi DB (seeded) |
| `vertical_glossary_installs` | Receipt for platform starter glossary packs | Pack id, terms installed | Until org/workspace delete | Lugemi DB |
| `fine_tune_jobs` | Rented-GPU / manual training jobs | Pack path, launcher, callback token, artifact, dataset link | Until org delete | Lugemi DB + `eval/finetune-packs/` |
| `voice_clones` | Vendor voice clone profiles | Consent, samples, review status, provider voice id | Until org/workspace delete | Lugemi DB + `storage/voices/` |
| `documents` + disk (`DOCUMENT_STORAGE_DIR`) | Uploaded / translated files | File bytes + metadata | Until delete; files unlinked on org delete | Lugemi disk |
| `knowledge_documents` / `knowledge_chunks` | RAG corpus | Filenames, chunk text, embeddings | Until delete | Lugemi DB (pgvector) + disk |
| `memory_records` | AI interaction Memory Cloud (VL-183) | Scope/kind, content, subject/agent/project/conversation ids, version, expiry | Until erase / org delete; `expiresAt` filtered on read | Lugemi DB; export/erase via `/v1/memory-cloud/*` + org export |
| `kg_entities` / `kg_relationships` | Bounded Knowledge Graph (VL-184) | Entity names/types, edges, optional knowledge doc link | Until delete / org delete | Lugemi DB; not Neo4j |
| Google Translate / Vision | MT, detect, OCR | Request text/images in transit | Vendor DPA; set `allowVendorTraining=false` by default | Google Cloud |
| OpenAI | STT, TTS, chat, embeddings | Audio/text in transit | Vendor DPA; do-not-train via contract + flag | OpenAI |
| Stripe | Billing | Customer / subscription ids | Stripe retention | Stripe |
| Clerk | Auth sessions | User / org identity | Clerk retention | Clerk |
| Resend (optional) | Transactional email | Job/usage/member alerts | Resend retention | Resend; `RESEND_API_KEY` |
| Twilio (optional) | Voice FAQ demo calls | Call metadata + recordings in transit | Twilio retention | Twilio; `TWILIO_*` |
| Sentry (optional) | Error tracking | Stack traces; avoid PII in messages | Per Sentry project | Sentry |

**Customer controls:** console `/data` and `/v1/organization/*` — retention setting, persist toggle, residency pin (`/v1/organization/residency`), export JSON, owner delete (cascade).
