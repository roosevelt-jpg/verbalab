# ADR-0128: Context Runtime (kernel over VL-185, not infinite-context OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-217 (library “Phase 84 Context Runtime” mapped)

## Context

Library Phase 84 asks for Context Runtime with conversation/workspace/knowledge/language/org/project/model/user context, prioritization, compression, retrieval, plus realtime/SDK/monitoring/docs.

VL-185 Context Engine already assembles those sources with char-budget compression. Regenerating a second assemble stack or claiming infinite context / LLM summarization would violate “extend, don’t regenerate.”

## Decision

1. **Ship** `/v1/context-runtime/*` as the AI Kernel context surface (VL-217).
2. **Reuse** VL-185 `ContextEngineService.assemble` as the source of blocks.
3. **Add** kernel prioritization table, standalone prioritize/compress, model hint block, `include.knowledge` alias, optional Intelligent Cache `namespace=context`.
4. **Defer** realtime context push and LLM summarization.
5. **Flip** AI Kernel catalog `context-runtime` → `partial`; `deferred.contextRuntime` → false.

## Consequences

- Context Runtime and Context Engine stay distinct consoles/APIs over one assemble implementation.
- Later Reasoning/Agent runtimes consume `promptContext` under permission/sandbox constraints.
