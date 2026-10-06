# ADR-0140: Atlas scaffold (interface family, not trained weights)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-225 (library “Phase 92 Atlas” mapped)

## Context

Library Phase 92 asks to “Build Atlas” as large reasoning models with reasoning/planning/coding/math/domain specialists, multilingual, long context, tool use, plus training/inference/eval/serving platforms.

Volume 9 README and ADR-0041/0135 forbid claiming trained competitive foundation weights without data, compute, and a research org. MLOps hubs (VL-235–237) already exist.

## Decision

1. **Ship VL-225 as an honest Atlas scaffold** — `/atlas` + engine/capabilities/overview/monitoring.  
2. **Map capabilities to existing modules** (Reasoning Runtime, Gateway chat, Context/Agent runtimes, Training/Eval/Registry/Serving).  
3. **Defer** coding/math/science/business/legal/medical/financial specialist weight programs.  
4. Keep `shipsTrainedAtlasWeights: false`, `scaffoldOnly: true`, `openAiReplacementOs: false`.  
5. **Architecture:** Nest modular monolith; CQRS GraphQL façade; `hexagonalRewrite: false`.  
6. Do **not** regenerate Volumes 1–8 or invent frontier-lab GPU clusters.

## Consequences

- Atlas is discoverable as a product family shell without fake completeness.  
- Baobab…Translate scaffolds (VL-226–234) can follow the same pattern.  
- Real Atlas weights remain blocked on research charter + capital (ADR-0041).
