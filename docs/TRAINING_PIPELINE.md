# Training Pipeline (VL-283)

Library Phase 150 — part of Volume 14 MLOps & LLMOps Cloud.

## Mission

VerbaLab Training Pipeline provides the Training Pipeline surface inside VerbaLab.

## Honesty

- Not Kubeflow OS, SageMaker/Vertex OS, Weights & Biases OS, MLflow OS, LangSmith OS, or Ray cluster OS.
- Extends Inference/Kernel/Foundation Models, RAG (Volume 6), Agent Runtime, and Prompt Runtime — does not regenerate Volumes 1–13.
- Trust Cloud deferred to Volume 15+ (`trustCloudOs=false`).

## Surfaces

- Console: `/training-pipeline`
- API: `/v1/training-pipeline/engine` (foundation: `/products`)
- ADR: [`docs/adr/0185-training-pipeline.md`](./adr/0185-training-pipeline.md)
