# AI Kernel — Performance Report (VL-223)

**Date:** 2026-10-03  
**Method:** Bounded sequential catalog smoke inside Nest vitest (not a k6 lab).

## Verdict

Public kernel engine catalogs respond within the audit smoke budget on a single Nest test process. This is **not** a load-test certification of production Fly/EKS capacity.

## Measured (audit smoke)

| Check | Budget | Result |
| --- | --- | --- |
| 24 sequential GETs across kernel engines | < 30s | Pass (vitest) |
| 12 rapid GETs on `/v1/ai-kernel/products` | < 15s | Pass (vitest) |

## Notes

- Agent/Workflow/Plugin runs are sandbox-simulated steps; latency is dominated by DB + optional LLM fixture, not a distributed kernel mesh.
- Policy `assertHardGate` adds one org-policy MemoryRecord scan per action — acceptable for sandbox hubs; not claimed as sub-ms policy OS.
- Invented k6/axe/kernel-benchmark platforms are **rejected** for this audit.
