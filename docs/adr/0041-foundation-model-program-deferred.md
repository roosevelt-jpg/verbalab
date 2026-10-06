# ADR-0041: Foundation model program deferred

- Status: Accepted (training program still deferred; platform hub reopened in ADR-0135)
- Date: 2026-09-07
- Updated: 2026-10-03
- Phase: VL-112

## Context

Roadmap VL-112 asks for named foundation models (Atlas, Baobab, Echo, …) as products on trained weights. Buy-vs-build says **Do not start** without a research org and capital. M10–M11 already deliver vendor MT, coverage eval, datasets, fine-tunes for failed pairs, a model registry, and rented-GPU training jobs.

## Decision

1. **Do not start VL-112 as a trained-weights program.** No claiming competitive foundation models without data, compute, and eval evidence.
2. **Use instead:** bought providers (Google/OpenAI/etc.), open weights only via VL-104/VL-111 fine-tunes when coverage fails, and VL-110 registry for what is live.
3. **Status:** training/research track remains `Blocked` on hires + budget.
4. **2026-10-03 exception (ADR-0135):** Volume 9 may ship an **honest Foundation Model Cloud hub** and MLOps scaffolds (VL-224+) that explicitly do **not** claim trained Atlas/Baobab/etc. weights. Empty fake-completeness remains forbidden.

## Consequences

- Executable roadmap through M11 is complete for a small team.
- Platform/MLOps scaffolding for Volume 9 is allowed under ADR-0135 honesty constraints.
- Marking VL-112 Done without weights and eval would still violate engineering standards (no fake completeness).
