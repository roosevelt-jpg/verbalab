# Lugemi AI Kernel

**Status:** Volume complete through Production Audit (VL-214–223 / library Phases 81–90)  
**Rule:** The AI Kernel is the **internal** execution layer — **not** a customer-facing product. Extends Inference Cloud + existing Memory/Prompt/Context/Reasoning/Orchestration modules. Do **not** regenerate Volumes 1–7 or invent a Linux/VAIOS rewrite. Roadmap: [`docs/roadmap/volume8-ai-kernel/`](./roadmap/volume8-ai-kernel/). Audit pack: [`docs/ai-kernel-audit/`](./ai-kernel-audit/).

Volumes 1–7 already ship Identity, Gateway, product clouds, Intelligence, Knowledge, and Inference. They execute through Nest + Gateway today — this volume layers a discoverable **kernel hub** for future runtimes without cloning those products.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| AI Kernel Foundation | **VL-214** — `/ai-kernel` + runtime catalog / overview |
| Memory Runtime | **Partial** — Phase 82 / VL-215 ([`MEMORY_RUNTIME.md`](./MEMORY_RUNTIME.md); extends Memory Cloud) |
| Prompt Runtime | **Partial** — Phase 83 / VL-216 ([`PROMPT_RUNTIME.md`](./PROMPT_RUNTIME.md); extends Prompt Intelligence) |
| Context Runtime | **Partial** — Phase 84 / VL-217 ([`CONTEXT_RUNTIME.md`](./CONTEXT_RUNTIME.md); extends Context Engine) |
| Reasoning Runtime | **Partial** — Phase 85 / VL-218 ([`REASONING_RUNTIME.md`](./REASONING_RUNTIME.md); extends Reasoning Cloud) |
| Agent Runtime | **Partial** — Phase 86 / VL-219 ([`AGENT_RUNTIME.md`](./AGENT_RUNTIME.md); sandbox + hard permission allowlists) |
| Workflow Runtime | **Partial** — Phase 87 / VL-220 ([`WORKFLOW_RUNTIME.md`](./WORKFLOW_RUNTIME.md); sandbox + hard permission allowlists; extends `/workflows`) |
| Plugin Runtime | **Partial** — Phase 88 / VL-221 ([`PLUGIN_RUNTIME.md`](./PLUGIN_RUNTIME.md); sandbox + hard permission allowlists; extends marketplace) |
| Policy Runtime | **Partial** — Phase 89 / VL-222 ([`POLICY_RUNTIME.md`](./POLICY_RUNTIME.md); hard-gate wired into Agent/Workflow/Plugin) |
| Production Audit | **Done** — **VL-223** evidence pack under [`ai-kernel-audit/`](./ai-kernel-audit/) |
| DDD / CQRS / Hexagonal | Bounded catalog CQRS slice — `hexagonalRewrite: false` |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console (internal) | `/ai-kernel` |
| Memory Runtime | `/memory-runtime` + `GET /v1/memory-runtime/engine` |
| Prompt Runtime | `/prompt-runtime` + `GET /v1/prompt-runtime/engine` |
| Context Runtime | `/context-runtime` + `GET /v1/context-runtime/engine` |
| Reasoning Runtime | `/reasoning-runtime` + `GET /v1/reasoning-runtime/engine` |
| Agent Runtime | `/agent-runtime` + `GET /v1/agent-runtime/engine` |
| Workflow Runtime | `/workflow-runtime` + `GET /v1/workflow-runtime/engine` |
| Plugin Runtime | `/plugin-runtime` + `GET /v1/plugin-runtime/engine` |
| Policy Runtime | `/policy-runtime` + `GET /v1/policy-runtime/engine` |
| REST catalog | `GET /v1/ai-kernel/products` (public) |
| REST engine | `GET /v1/ai-kernel/engine` |
| REST overview | `GET /v1/ai-kernel/overview` (Clerk session) |
| Monitoring | `GET /v1/ai-kernel/monitoring` |
| GraphQL | `aiKernelRuntimes` |
| OpenAPI | `/v1/openapi.json` |
| SDK | `aiKernelProducts()` on `@lugemi/sdk` |
| CLI | `lugemi ai-kernel-products` |

## Action safety (README)

1. **Agent / Workflow / Plugin (Phases 86–88)** — must have scoped permissions and sandboxing; not open function calls against real accounts/data.
2. **Policy Runtime (Phase 89)** — must be a **hard gate** wired into those runtimes (requests blocked), not log/flag-only decoration.

## Honesty

| Flag | Value |
| --- | --- |
| `customerFacingProduct` | false |
| `linuxOsRewrite` | false |
| `vaiosOs` | false |
| `regeneratesVolumes1to7` | false |
| `hexagonalRewrite` | false |
| `agentActionBoundariesRequired` | true |
| `policyHardGateRequired` | true |

See ADR-0125.
