# ADR-0108: Taxonomy Platform (classification trees, not enterprise taxonomy OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-197 (library “Phase 64 Taxonomy Platform” mapped)

## Context

Library Phase 64 asks for an Enterprise Taxonomy Platform with categories, tags, classifications, metadata, content types, knowledge trees, and automatic classification — plus engine/REST/SDK/dashboard.

Ontology (VL-196) already models concepts/hierarchies. Knowledge Base (VL-194) already has collection/tags/contentKind. A separate taxonomy product should classify documents without becoming SharePoint/Drupal taxonomy OS or shipping ML classifiers.

## Decision

1. **Ship** `/v1/taxonomy/*` with `TaxonomyTerm` trees and `TaxonomyAssignment` to knowledge documents — always org+workspace scoped.
2. **Kinds:** `category` | `tag` | `content_type`; assign syncs to KnowledgeDocument fields by default.
3. **Automatic classification** = keyword/heuristic match of term name/slug to filename/tags/collection — not ML.
4. **Defer** enterprise taxonomy OS, ML classifiers, metadata schema registry.
5. **Keep distinct** from Ontology Platform (concepts/is_a vs document classification trees).
6. **Flip** Knowledge Cloud catalog `taxonomy-platform` → `partial`.

## Consequences

- Document classification is first-class without regenerating Ontology or EKB.
- Taxonomy Platform (VL-197) and Ontology (VL-196) remain separate products linked from Knowledge Cloud.
