# VerbaLab Model Evaluation Platform

**Status:** Partial (VL-236 / library Phase 103)  
**Rule:** Hub over **VL-100** coverage/eval plus sandbox bias/safety/latency suites. Does **not** ship MMLU/HumanEval/MT-Bench corpora, claim SOTA, or invent a global leaderboard OS. Roadmap: [`docs/roadmap/volume9-foundation-model-cloud/`](./roadmap/volume9-foundation-model-cloud/).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Model Evaluation Platform | **VL-236** — `/model-evaluation-platform` + run plans |
| MMLU / HumanEval / MT Bench | **Deferred** |
| Translation Benchmarks | **Partial** — handoff to `POST /v1/eval/run` (ADR-0034) |
| Speech / Vision / Reasoning Benchmarks | **Deferred** |
| Bias / Safety / Latency | **Partial** — sandbox heuristic scores |
| Leaderboards | **Partial** — org-scoped local ranks only |
| Reports / Analytics | **Partial** — aggregates + coverage snapshot |
| DDD / CQRS / Hexagonal | Bounded catalog CQRS slice — `hexagonalRewrite: false` |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/model-evaluation-platform` |
| REST engine | `GET /v1/model-evaluation-platform/engine` |
| REST suites | `GET /v1/model-evaluation-platform/suites` |
| REST overview | `GET /v1/model-evaluation-platform/overview` |
| Runs | `GET/POST /v1/model-evaluation-platform/runs` |
| Execute | `POST /v1/model-evaluation-platform/runs/:id/execute` |
| Leaderboard | `GET /v1/model-evaluation-platform/leaderboard` |
| Reports | `GET /v1/model-evaluation-platform/reports` |
| Monitoring | `GET /v1/model-evaluation-platform/monitoring` |
| GraphQL | `modelEvaluationSuites` |
| SDK | `modelEvaluationPlatformEngine()` |
| CLI | `verbalab model-evaluation-platform-engine` |
| Underlying harness | `/v1/coverage`, `POST /v1/eval/run` (VL-100) |

## Honesty

| Flag | Value |
| --- | --- |
| `sotaClaimsForbidden` | true |
| `globalLeaderboardOs` | false |
| `mmluOs` | false |
| `regeneratesVl100` | false |
| `extendsVl100Coverage` | true |

See ADR-0137.
