# Lugemi Taxonomy Platform

**Status:** Partial (VL-197 / library Phase 64)  
**Parent:** [Knowledge Cloud](./KNOWLEDGE_CLOUD.md)  
**Rule:** Workspace-scoped categories, tags, content-type terms, and knowledge trees for classifying Knowledge Base documents. Distinct from [Ontology](./ONTOLOGY_PLATFORM.md). Do **not** invent enterprise taxonomy OS or ML auto-classification.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/taxonomy` |
| Engine | `GET /v1/taxonomy/engine` |
| Content types | `GET /v1/taxonomy/content-types` |
| Terms | `GET/POST /v1/taxonomy/terms` |
| Trees | `GET /v1/taxonomy/trees` |
| Children | `GET /v1/taxonomy/terms/:id/children` |
| Assign | `POST /v1/taxonomy/assign` `{ termId, documentId }` |
| Classify | `POST /v1/taxonomy/classify` `{ documentId, apply? }` (heuristic) |
| Analytics / monitoring | `GET /v1/taxonomy/analytics` · `/monitoring` |
| GraphQL | `taxonomyEngine` |
| SDK / CLI | `taxonomyEngine()` · `lugemi taxonomy-engine` |

## Kind → Knowledge Document sync

| Term kind | On assign (default) |
| --- | --- |
| `category` | Sets `collection` to term slug |
| `tag` | Appends slug to `tags` |
| `content_type` | Sets `contentKind` to term slug |

## Honesty

| Flag | Value |
| --- | --- |
| `enterpriseTaxonomyOs` | false |
| `mlAutoClassification` | false |
| `schemaRegistry` | false |
| `orgWorkspaceScoped` | true |
| `distinctFromOntology` | true |

See ADR-0108.
