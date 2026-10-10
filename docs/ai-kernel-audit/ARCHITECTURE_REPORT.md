# AI Kernel — Architecture Report (VL-223)

**Date:** 2026-10-03  
**Scope:** VL-214–222 AI Kernel volume (extends Inference Cloud VL-204–213)

## Verdict

AI Kernel is a **hub over Nest modular monolith runtime modules**, not a separate OS process and not a customer-facing product. REST is primary; GraphQL is a façade; CQRS applies to the AI Kernel catalog slice (VL-214).

## System shape

| Layer | Reality |
| --- | --- |
| Runtime | NestJS API (`apps/api`) + Next.js console (`apps/web`) |
| Data | Postgres MemoryRecords (`metadata.layer=kernel`) + audit events |
| Hub | `GET /v1/ai-kernel/products` + `/ai-kernel` console |
| Deploy | Fly.io default; optional AWS EKS `af-south-1` |
| Blueprint | ADR-0080 layers; Kernel is Volume 8 internal execution layer |

## Capability map (honest)

| Product | VL | Status note |
| --- | --- | --- |
| Foundation | 214 | Internal hub/catalog/overview |
| Memory Runtime | 215 | Kernel over Memory Cloud |
| Prompt Runtime | 216 | Extends Prompt Intelligence |
| Context Runtime | 217 | Extends Context Engine |
| Reasoning Runtime | 218 | Extends Reasoning Cloud; no tool exec |
| Agent Runtime | 219 | Sandbox + hard allowlist |
| Workflow Runtime | 220 | Sandbox; extends `/workflows` |
| Plugin Runtime | 221 | Sandbox registry; not extension OS |
| Policy Runtime | 222 | Hard gate wired into Agent/Workflow/Plugin |

## Integration findings

- All nine catalog entries discoverable; Agent→Policy `policyRuntimeWired: true`.
- GraphQL exposes kernel engines without regenerating REST.
- Agent/Workflow/Plugin call `PolicyRuntimeService.assertHardGate` (403 on deny).
- Sibling Inference/product clouds are **not** regenerated.

## Rejected architecture claims

- Customer-facing AI Kernel product  
- Linux / VAIOS OS rewrite / hexagonal rewrite  
- LangGraph / AutoGPT / Temporal / Airflow / browser extension OS  
- OPA / Cedar enterprise GRC OS  
- **Foundation Model Cloud invented in this audit** (Volume 9 when scheduled)
