# AI Kernel — Coverage Report (VL-223)

**Date:** 2026-10-03

## Verdict

Executable Kernel phases have dedicated vitest suites. This report is an **inventory**, not a claim of 100% line coverage tooling.

## Spec inventory

| Suite | Phase | Focus |
| --- | --- | --- |
| `ai-kernel.spec.ts` | VL-214 | Hub catalog / deferred / GraphQL |
| `memory-runtime.spec.ts` | VL-215 | Kernel memory honesty |
| `prompt-runtime.spec.ts` | VL-216 | Prompt execute surfaces |
| `context-runtime.spec.ts` | VL-217 | Assemble / compress |
| `reasoning-runtime.spec.ts` | VL-218 | Plan/reason honesty |
| `agent-runtime.spec.ts` | VL-219 | Permissions + sandbox run |
| `workflow-runtime.spec.ts` | VL-220 | Permissions + approve/rollback |
| `plugin-runtime.spec.ts` | VL-221 | Permissions + invoke |
| `policy-runtime.spec.ts` | VL-222 | Hard gate + Agent wiring |
| `ai-kernel-audit.spec.ts` | VL-223 | Volume close evidence |

## Gaps (honest)

- No dedicated e2e Playwright covering Clerk console flows for every runtime page.
- Marketplace `kind=plugin` / `kind=agent` may count 0 (marketplace kinds today are glossary/prompt/dataset).
- Realtime agent bus and distributed workflow execution remain deferred.
