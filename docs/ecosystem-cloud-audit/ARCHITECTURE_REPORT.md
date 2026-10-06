# Ecosystem Cloud — Architecture Report (VL-259)

## Style

- Nest modular monolith (`nest_modular_monolith`)
- Bounded marketplace hubs with CQRS catalog slices (`cqrs: true`, `hexagonalRewrite: false`)
- Hub services **extend** VL-090+/VL-177/runtime modules — do not regenerate Volumes 1–10

## Product map

| Product | VL | Backbone |
| --- | --- | --- |
| Ecosystem Foundation | 249 | Discovery/routing hub |
| Plugin Marketplace | 250 | Plugin Runtime + PluginPolicyGate |
| Model Marketplace | 251 | Model Registry / VL-110 |
| Dataset Marketplace | 252 | Dataset kind + VL-101 |
| Prompt Marketplace | 253 | Prompt kind + Prompt Fabric |
| Agent Marketplace | 254 | Agent Runtime + AgentPolicyGate |
| Workflow Marketplace | 255 | Workflow Runtime + WorkflowPolicyGate |
| Connector Marketplace | 256 | Connector catalog + Slack (ADR-0026) |
| Voice & Language Marketplace | 257 | VL-177 + Volume 1 packs |
| Creator Economy | 258 | VL-092 Stripe Connect + MarketplaceSale |

## Cross-cutting

- `MarketplaceListing` / `MarketplaceSale` / `MarketplaceInstall` for Volume 11 hubs (hub marker in snapshot where used)
- FabricPolicyGate buses: `*-marketplace`, `creator-economy`
- Platform fee honesty: hubs 15% (1500 bps); content marketplace Connect default 20%; VL-177 voice 10% noted
- Primary region docs: `af-south-1` (EKS optional); Fly default

## Rejected architectures

Payment-processor OS · tax engine OS · card vault · Zapier/iPaaS OS · Hugging Face hub · ElevenLabs CDN · LangGraph/AutoGPT OS · Digital Twin Platform (Volume 12+)
