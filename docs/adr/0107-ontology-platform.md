# ADR-0107: Ontology Platform (concepts over VL-184 KG, not OWL/Protege OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-196 (library “Phase 63 Ontology Platform” mapped)

## Context

Library Phase 63 asks for an Ontology Platform with concepts, entities, relationships, hierarchies, categories, synonyms, multilingual ontologies, and vertical packs (medical/legal/financial/government/education) — plus engine/REST/GraphQL/SDK/dashboard.

VL-184 already ships a bounded Postgres entity/relationship layer. Inventing OWL/RDF stores or certified vertical ontologies would violate honesty and “extend, don’t regenerate.”

## Decision

1. **Ship** `/v1/ontology/*` hub over `KgEntity` / `KgRelationship`.
2. **Concepts** = entities with `type=concept|category`; **hierarchies** = `is_a` edges; **synonyms** = aliases + optional `synonym_of`.
3. **Multilingual** = `metadata.labels` map — not a full i18n ontology OS.
4. **Vertical domains** = allowed domain tags with deferred certified packs.
5. **Defer** OWL/Protegé/RDF triple-store parity and SNOMED/FIBO/etc.
6. **Flip** Knowledge Cloud catalog `ontology-platform` → `partial`; link from Knowledge Graph catalog.

## Consequences

- Ontology stays a product surface on the shared KG tables — no second graph database.
- Taxonomy Platform (VL-197) remains the classification/tree product.
