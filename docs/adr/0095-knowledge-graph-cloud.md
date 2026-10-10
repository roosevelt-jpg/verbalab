# ADR-0095: Knowledge Graph Cloud (bounded ER over Postgres)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-184 (library “Phase 51 Knowledge Graph Cloud” mapped)

## Context

Library Phase 51 asks for entities, relationships, ontologies, taxonomies, knowledge linking, semantic relationships, and vertical enterprise/government/medical/legal/financial/educational graphs plus REST/GraphQL/SDK, dashboard, monitoring, analytics, and production deployment.

ROADMAP VL-184 requires a **bounded** entity/relationship layer **or honest deferral to RAG**, not a Neo4j enterprise KG OS. Ontology/taxonomy platforms are out of scope (vision backlog). Buy vs build: prefer RAG.

## Decision

1. Ship **Knowledge Graph Cloud** hub under `/v1/knowledge-graph/*` + console `/knowledge-graph`.  
2. Store entities/edges in Postgres (`kg_entities`, `kg_relationships`) with workspace tenancy and cascade delete.  
3. Support optional **knowledge linking** via `documentId` to VL-062 documents.  
4. Provide **1-hop neighborhood** query; defer multi-hop / Cypher / graph vendors.  
5. Catalog vertical domain packs as **deferred**; only `domain=general` accepts writes.  
6. Mark ontologies/taxonomies deferred; keep Intelligence honesty `knowledgeGraphOs: true` (Neo4j OS still deferred) while `knowledgeGraphProduct: false` (hub shipped).  
7. Document that RAG remains the primary retrieval/answer path.

## Consequences

- Intelligence Cloud marks knowledge-graph `partial` with hub links.  
- Context Engine (VL-185) may later include neighborhood snippets alongside RAG/memory.  
- Customer-paid graph vendor remains a future buy decision, not a rebuild.
