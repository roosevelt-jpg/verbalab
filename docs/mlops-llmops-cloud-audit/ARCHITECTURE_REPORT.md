# MLOps & LLMOps Cloud — Architecture Report (VL-291)

## Style

Nest modular monolith with DDD-bounded MLOps & LLMOps hubs, CQRS application slices, and hexagonal ports/adapters (`hexagonalRewrite: false`).

## Hubs

| Hub | VL | Pattern |
| --- | --- | --- |
| mlops-llmops-cloud | VL-281 | Foundation catalog + routing + overview |
| dataset-pipeline | VL-282 | Pipeline runs over dataset marketplace/VL-101 |
| training-pipeline | VL-283 | LoRA/QLoRA/DPO/RLHF/SFT jobs |
| continuous-evaluation | VL-284 | Gate status for Continuous Learning |
| promptops-platform | VL-285 | PromptOps over Prompt Runtime/Fabric |
| ragops-platform | VL-286 | RAGOps over Volume 6 RAG |
| agentops-platform | VL-287 | AgentOps with human-visible policy violations |
| ai-drift-detection | VL-288 | Drift clear check for promote |
| continuous-learning | VL-289 | Gated promote — never auto |
| ai-operations-dashboard | VL-290 | Sibling catalog aggregation |

## Extends

Inference Cloud, AI Kernel, Foundation Model Cloud, RAG (Volume 6), Agent Runtime, Prompt Runtime / Prompt Fabric, evaluation-platform / model-evaluation, dataset marketplace — without regenerating Volumes 1–13.
