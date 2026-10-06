# ADR-0144: Knowledge Fabric (router over Knowledge Cloud)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-242 (library “Phase 109 Knowledge Fabric” mapped)

## Context

Library Phase 109 asks for Knowledge Fabric supporting distribution, synchronization, federation, routing, cross-workspace knowledge, and Enterprise Search integration — plus Knowledge Router, REST, SDK, monitoring, docs.

Knowledge Cloud (VL-193+) already owns KB/Search/RAG/ontology/taxonomy/memory products. Regenerating that stack would violate “extend, don’t regenerate.”

## Decision

1. **Schedule** Knowledge Fabric as executable **VL-242**.  
2. **Knowledge Fabric = router + plan façade** over Knowledge Cloud / Enterprise Search — `regeneratesKnowledgeCloud: false`.  
3. **Ship** capability catalog, routing table, `POST /route`, authenticated `POST /distribute` and `/sync` (same-org peers), `POST /federate` handoff catalog.  
4. **Optional Event Fabric** CloudEvents for distribute/sync publication.  
5. **Honesty:** not Confluence/SharePoint/Neo4j/Elastic OS; `crossOrgDataPlane: false`.  
6. **Surfaces:** `/knowledge-fabric`, REST, GraphQL CQRS, SDK/CLI, docs + OpenAPI.  
7. Update AI Fabric / Context Fabric deferred flags: Knowledge Fabric → shipped.  
8. Do **not** regenerate Volumes 1–9 or VL-062 RAG.

## Consequences

- Knowledge intents are discoverable and plannable from one fabric hub.  
- Document bytes stay in Knowledge Cloud; fabric records plans/cursors/events.  
- Prompt Fabric (VL-243) can specialize prompt routing next.
