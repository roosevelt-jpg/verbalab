# Research Cloud (VL-271–280)

Library Phase 138 → Research Cloud Foundation (VL-271). Volume 13 incubates internal R&D — experiments, synthetic data, benchmarks, evaluation, publications, patents, open science, and research analytics — that later graduates into production services.

## Mission

Build Lugemi’s Research Cloud as an incubation hub over Intelligence / Knowledge / Foundation Model clouds. **Not** Weights & Biases OS, Hugging Face hub OS, DOI registry OS, USPTO patent OS, MLflow OS, or public leaderboard OS. **AI Sovereignty Cloud** is deferred to Volume 14+ (`aiSovereigntyOs: false`).

## Research areas

language · speech · voice · vision · reasoning · multimodal · embeddings · agents · roboticsInterfaces · edgeAi · quantumAiResearchReadiness · syntheticData · evaluation · benchmarking · responsibleAi

## Product catalog

| Product | Status |
| --- | --- |
| Research Cloud Foundation | **Shipped** — VL-271 — this doc |
| Experiment Platform | **Shipped** — VL-272 — [`EXPERIMENT_PLATFORM.md`](./EXPERIMENT_PLATFORM.md) |
| Synthetic Data Platform | **Shipped** — VL-273 — [`SYNTHETIC_DATA_PLATFORM.md`](./SYNTHETIC_DATA_PLATFORM.md) |
| Benchmark Platform | **Shipped** — VL-274 — [`BENCHMARK_PLATFORM.md`](./BENCHMARK_PLATFORM.md) |
| Evaluation Platform | **Shipped** — VL-275 — [`EVALUATION_PLATFORM.md`](./EVALUATION_PLATFORM.md) |
| AI Publication Platform | **Shipped** — VL-276 — [`AI_PUBLICATION_PLATFORM.md`](./AI_PUBLICATION_PLATFORM.md) |
| Patent & Innovation Platform | **Shipped** — VL-277 — [`PATENT_INNOVATION_PLATFORM.md`](./PATENT_INNOVATION_PLATFORM.md) |
| Open Science Platform | **Shipped** — VL-278 — [`OPEN_SCIENCE_PLATFORM.md`](./OPEN_SCIENCE_PLATFORM.md) |
| Research Analytics | **Shipped** — VL-279 — [`RESEARCH_ANALYTICS.md`](./RESEARCH_ANALYTICS.md) |
| Production Audit | **Shipped** — VL-280 — [`docs/research-cloud-audit/`](./research-cloud-audit/) |
| DDD / CQRS / Hexagonal | Bounded catalog CQRS slice — `hexagonalRewrite: false` |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS |

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/research-cloud` |
| REST catalog | `GET /v1/research-cloud/products` (public) |
| REST engine | `GET /v1/research-cloud/engine` |
| REST routing | `GET /v1/research-cloud/routing` |
| REST overview | `GET /v1/research-cloud/overview` (Clerk session) |
| REST monitoring | `GET /v1/research-cloud/monitoring` |
| GraphQL | `researchCloudProducts` |
| Docs | `/docs/RESEARCH_CLOUD.md` |

## Honesty (foundation)

- `regeneratesVolumes1to12: false`
- `weightsAndBiasesOs: false`, `mlflowOs: false`, `huggingFaceHubOs: false`
- `doiRegistryOs: false`, `usptoOs: false`, `publicLeaderboardOs: false`
- `aiSovereigntyOs: false` (Volume 14+ — not invented here)
- `syntheticLabelRequired: true`
- `traditionalKnowledgeConsentRequired: true`

## Safety notes

- Synthetic data used with Volume 12 sensitive domains must remain labeled `isSynthetic` downstream.
- Open releases carrying traditional knowledge require Volume 12 consent fields (`provenance`, `sourceCommunity`, `consentStatus`) and block `restricted` / `unverified`.

---

## Volume status

**Volume 13 closed** (VL-271–280). Production Audit evidence: [`docs/research-cloud-audit/`](./research-cloud-audit/). AI Sovereignty Cloud deferred to Volume 14+.
