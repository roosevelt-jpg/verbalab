# Lugemi Ontology Platform

**Status:** Partial (VL-196 / library Phase 63)  
**Parent:** [Knowledge Cloud](./KNOWLEDGE_CLOUD.md)  
**Backing store:** Knowledge Graph entities/edges (VL-184)  
**Rule:** Concepts, hierarchies (`is_a`), synonyms, and multilingual labels — org/workspace scoped. Do **not** invent OWL/RDF/Protegé OS or certified medical/legal ontologies.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/ontology` |
| Engine | `GET /v1/ontology/engine` |
| Domains | `GET /v1/ontology/domains` |
| Concepts | `GET/POST /v1/ontology/concepts` |
| Labels | `POST /v1/ontology/concepts/:id/labels` |
| Children | `GET /v1/ontology/concepts/:id/children` |
| Hierarchies | `POST /v1/ontology/hierarchies` `{ parentId, childId }` |
| Synonyms | `POST /v1/ontology/synonyms` |
| Analytics / monitoring | `GET /v1/ontology/analytics` · `/monitoring` |
| GraphQL | `ontologyEngine` |
| SDK / CLI | `ontologyEngine()` · `lugemi ontology-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `owlOs` | false |
| `protegeParity` | false |
| `rdfTripleStore` | false |
| `certifiedVerticalOntologies` | false |
| `orgWorkspaceScoped` | true |
| `extendsVl184` | true |

Vertical domains (`medical`, `legal`, …) are **tags** on concepts — not SNOMED/FIBO packs.

See ADR-0107.
