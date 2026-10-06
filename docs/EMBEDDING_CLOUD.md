# VerbaLab Embedding Cloud

**Status:** Partial shipped (VL-181 / library Phase 48)  
**Rule:** Productize text embeddings over VL-063 / AI Gateway. Do not train embedding models. Do not claim speech/image/video/cross-modal parity.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Embedding Engine / Dashboard | **VL-181** — `GET /v1/embedding-cloud/engine` + `/embedding-cloud` |
| Text Embeddings | **Shipped** — `POST /v1/embeddings` + `POST /v1/embedding-cloud/embed` |
| Document Embeddings | **Partial** — text path + Knowledge RAG chunks (VL-062) |
| Code Embeddings | **Partial** — text path with `modality=code` |
| Multilingual | **Partial** — vendor multilingual text model |
| Speech / Voice / Image / Video / Cross-modal / Hybrid | **Deferred** |
| Models | `GET /v1/embedding-cloud/models` |
| Analytics / Monitoring | **Shipped** — `/analytics`, `/monitoring` |
| GraphQL / SDK / CLI | `embeddingCloudEngine`, `verbalab embedding-cloud-engine` |
| Related | Intelligence Cloud hub; Vector Cloud = VL-182 |

---

## Honesty

Not Voyage/Cohere multimodal. See ADR-0092. Live embeds need `OPENAI_API_KEY`.
