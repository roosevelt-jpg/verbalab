# ADR-0189: AgentOps Platform (VL-287)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-287 (library Phase 154)

## Context

Volume 14 builds an MLOps & LLMOps ops layer over existing Inference, Kernel, Foundation Model, RAG, Agent Runtime, and Prompt Runtime surfaces. Risks: inventing Kubeflow/SageMaker/Vertex/W&B/MLflow/LangSmith/Ray OS, auto-promoting retrained models, or inventing Trust Cloud.

## Decision

1. Ship `agentops-platform` as a Nest hub with catalog + service + controller + CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit in engine catalogs.
3. Continuous Learning promote remains human-gated with drift + continuous-eval required checks; AgentOps surfaces policy violations for humans.
4. Trust Cloud remains deferred to Volume 15+.

## Consequences

- AgentOps Platform is discoverable under MLOps & LLMOps Cloud Foundation.
- Operators can inspect catalogs without claiming hyperscaler training/ops OS coverage.
