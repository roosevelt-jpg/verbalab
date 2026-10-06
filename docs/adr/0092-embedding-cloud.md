# ADR-0092: Embedding Cloud (product hub over VL-063)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-181 (library “Phase 48 Embedding Cloud” mapped)

## Context

Library Phase 48 asks for text/speech/voice/image/video/document/code/cross-modal/hybrid/multilingual embeddings plus engine, REST/GraphQL/SDK, dashboard, monitoring, analytics, and production deployment.

VerbaLab already ships gateway embeddings (VL-063) and uses them in RAG (VL-062). Training models or faking multimodal encoders would violate honesty rules. Voice biometric vectors (VL-152/176) are a different product.

## Decision

1. Ship **Embedding Cloud** hub under `/v1/embedding-cloud/*` + console `/embedding-cloud`.  
2. **Keep** `POST /v1/embeddings` as the OpenAI-shaped create API (VL-063).  
3. Add `POST /v1/embedding-cloud/embed` with optional `modality` (`text` | `document` | `code`).  
4. **Reject** speech/image/video/cross-modal/hybrid modalities with clear deferred errors.  
5. Catalog models from OpenAI defaults; do **not** train embedding models.  
6. Analytics/monitoring from `usage_events` + audits.

## Consequences

- Intelligence Cloud marks embeddings `partial` with hub links.  
- Multimodal remains deferred until Vision / speech embedding ROADMAP work.  
- Vector storage productization remains VL-182.
