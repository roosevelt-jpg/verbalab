# Lugemi AI Decision Engine

**Status:** Partial shipped (VL-189 / library Phase 56)  
**Rule:** Bounded decision helpers (policy/routing) over light rules + plan entitlements. Do **not** build Drools/Pega enterprise BRMS parity.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Model Selection | **Shipped** — `kind=model_selection` fixed catalog + plan gate |
| Routing | **Shipped** — `kind=routing` intent → API surface |
| Fallback | **Shipped** — `kind=fallback` ordered chains |
| Confidence Scoring | **Partial** — heuristic score, not calibrated ML |
| Risk Analysis | **Partial** — light flags (quota/PII-ish/injection) |
| Policy Decisions | **Shipped** — plan/vendor-training/quota/org-disabled |
| Safety Decisions | **Partial** — pattern gate; not moderation OS |
| Tool Selection | **Shipped** — suggest-only from fixed catalog |
| Workflow Decisions | **Shipped** — fixed API recipes |
| Cost Optimization | **Partial** — prefer economy models |
| Enterprise BRMS | **Deferred** |
| Engine / Dashboard | **VL-189** — `GET /v1/decision-engine/engine` + `/decision-engine` |
| GraphQL / SDK / CLI | `decisionEngine`, `lugemi decide` |

---

## Honesty

Not Drools/Pega. See ADR-0100. Tools are suggested, never executed.
