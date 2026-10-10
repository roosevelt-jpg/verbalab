# AI Fabric — Architecture Report (VL-248)

## Style

- Nest modular monolith (`nest_modular_monolith`)
- Bounded fabric hubs with CQRS catalog slices (`cqrs: true`, `hexagonalRewrite: false`)
- Fabric services **delegate** to Runtime/Cloud modules — extend, don’t regenerate Volumes 1–9

## Bus map

| Bus | VL | Backbone |
| --- | --- | --- |
| AI Fabric Foundation | 239 | Discovery/routing hub |
| Event Fabric | 240 | Redis Streams + CloudEvents (memory fallback) |
| Context Fabric | 241 | Context Runtime |
| Knowledge Fabric | 242 | Knowledge Cloud |
| Prompt Fabric | 243 | Prompt Runtime |
| Reasoning Fabric | 244 | Reasoning Runtime |
| Memory Fabric | 245 | Memory Runtime |
| Agent Fabric | 246 | Agent Runtime (sandboxed) |
| Policy Fabric | 247 | Policy Runtime + `FabricPolicyGate` |

## Cross-cutting

- Same-org peer distribute/sync only (`crossWorkspaceSameOrgOnly: true`)
- Optional Event Fabric CloudEvents on distribute
- Policy Fabric hard-gates Agent/Memory/Policy distribute planes
- Primary region docs: `af-south-1` (EKS optional); Fly default

## Rejected architectures

Kafka hyperscaler OS · service mesh OS · custom reasoner OS · Mem0 OS · LangGraph/AutoGPT OS · OPA/Cedar GRC OS
