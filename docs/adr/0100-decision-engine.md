# ADR-0100: AI Decision Engine (light rules, not BRMS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-189 (library “Phase 56 AI Decision Engine” mapped)

## Context

Library Phase 56 asks for model selection, routing, fallback, confidence, risk, policy, safety, tool/workflow decisions, and cost optimization plus REST/GraphQL/SDK, dashboard, monitoring, docs, and production deployment.

ROADMAP VL-189: bounded decision helpers (policy/routing) over LLM + rules — not enterprise BRMS. Out of scope: Drools/Pega parity.

## Decision

1. Ship **AI Decision Engine** hub under `/v1/decision-engine/*` + console `/decision-engine`.  
2. Implement **`POST /decide`** with `kind` discriminators backed by **light rules** over plan/entitlements and fixed catalogs.  
3. Reuse billing plan + org governance fields for policy decisions.  
4. Tool/workflow kinds **suggest only** — do not execute tools.  
5. Mark enterprise BRMS deferred; honesty flags `enterpriseBrms` / `droolsPegaParity` = false.  
6. Confidence/risk/safety are heuristic — not calibrated ML or a moderation OS.

## Consequences

- Intelligence Cloud marks decision-engine `partial` with hub links.  
- AI Orchestration (VL-190) coordinates real e2e gateway requests (ADR-0101), not a multi-cloud agent OS.
