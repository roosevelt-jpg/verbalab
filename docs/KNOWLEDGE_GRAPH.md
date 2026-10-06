# VerbaLab Knowledge Graph Cloud

**Status:** Partial shipped (VL-184 / library Phase 51)  
**Rule:** Bounded entity/relationship layer in Postgres. Prefer Knowledge/RAG (VL-062) for retrieval. Do not claim Neo4j / ontology / taxonomy enterprise OS parity.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Entities / Relationships | **Shipped** — `kg_entities` / `kg_relationships` |
| Knowledge Linking | **Shipped** — optional `documentId` → Knowledge docs |
| Semantic Relationships | **Partial** — typed labels; embedding-inferred edges deferred |
| Ontologies / Taxonomies | **Deferred** — vision backlog |
| Enterprise Graph | **Partial** — general workspace graph |
| Government / Medical / Legal / Financial / Educational | **Deferred** domain packs (`domain=general` only) |
| Engine / Dashboard | **VL-184** — `GET /v1/knowledge-graph/engine` + `/knowledge-graph` |
| Neighborhood query | **Shipped** — 1-hop; multi-hop/Cypher deferred |
| GraphQL / SDK / CLI | `knowledgeGraphEngine`, `verbalab knowledge-graph-engine` |
| Related | Prefer `POST /v1/knowledge/query` for answers |

---

## Honesty

Not Neo4j. Not an ontology platform. See ADR-0095.
