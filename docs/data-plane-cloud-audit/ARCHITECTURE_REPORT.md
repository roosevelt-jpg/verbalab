# Data Plane Cloud — Architecture Report

## Role

Data Plane executes customer workloads. Control Plane (Volume 17) manages orgs/policies/billing.

## Pattern

Each runtime hub is a thin Nest façade:

1. Catalog of routing capabilities + `routesTo` upstream modules.
2. Service injects existing product Nest modules and exposes `route`/`execute` that returns upstream endpoints + status.
3. CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.

## Upstream map

| Runtime | Upstream |
| --- | --- |
| translation-runtime | translate |
| speech-runtime | speech-cloud, speech-recognition |
| voice-runtime | voice-cloud, voice |
| vision-runtime | ocr, documents |
| knowledge-runtime | knowledge-cloud, knowledge, knowledge-fabric |
| embedding-runtime | embeddings, embedding-cloud |
| data-plane-streaming | streaming-runtime |
| gpu-runtime | gpu-platform |
