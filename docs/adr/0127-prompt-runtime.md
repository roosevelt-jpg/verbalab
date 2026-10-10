# ADR-0127: Prompt Runtime (kernel execution over VL-086/188, not research lab)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-216 (library “Phase 83 Prompt Runtime” mapped)

## Context

Library Phase 83 asks for Prompt Runtime with execution, templates, variables, routing, versioning, optimization, security, validation, cache, analytics, registry integration, plus REST/GraphQL/SDK/monitoring/docs.

VL-086 already versions chat/rag/voice_faq prompts. VL-188 Prompt Intelligence adds preview/evaluate/security over that registry. Regenerating a third prompt store or inventing an auto-prompt research lab / mesh would violate “extend, don’t regenerate.”

## Decision

1. **Ship** `/v1/prompt-runtime/*` as the AI Kernel prompt surface (VL-216).
2. **Reuse** VL-086 `PromptsService` for resolve/versions and VL-188 for security scan/registry façades.
3. **Execute** = resolve + `{{var}}` render + heuristic validate (+ optional security) — **no LLM call**.
4. **Cache** via Intelligent Cache `namespace=prompt` (opt-in) — not Redis OS; Gateway not auto-wired.
5. **Routing** = sandbox feature→key table — not a prompt mesh.
6. **Optimization** = heuristic trim/tips — research lab remains deferred.
7. **Flip** AI Kernel catalog `prompt-runtime` → `partial`; `deferred.promptRuntime` → false.

## Consequences

- Prompt Runtime, Prompt Intelligence, and `/v1/prompts` stay distinct consoles/APIs over one versioned registry.
- Later Agent Runtime (VL-219) should consume execute output under scoped permissions; Policy Runtime (VL-222) hard-gates actions, not prompt text alone.
