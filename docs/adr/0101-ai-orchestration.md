# ADR-0101: AI Orchestration (load-bearing e2e, not agent OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-190 (library “Phase 57 AI Orchestration” mapped)

## Context

Library Phase 57 asks for multi-model execution, multi-cloud routing, workflow orchestration, agent collaboration, tool/model chaining, pipeline execution, and distributed AI plus REST/GraphQL/SDK, monitoring, analytics, docs, and production deployment.

ROADMAP VL-190: load-bearing orchestration that coordinates gateway/engines; exercise real e2e requests. Out of scope: multi-cloud agent OS. Depends on VL-180–189.

## Decision

1. Ship **AI Orchestration** hub under `/v1/ai-orchestration/*` + console `/ai-orchestration`.  
2. Implement **`POST /run`** with named pipelines that call existing services (Translate, Chat, Gateway detect, Decision Engine, Context Engine).  
3. Keep VL-083 `/v1/workflows` for job-runner recipes; orchestration hub is the Intelligence Cloud product surface.  
4. Defer multi-cloud routing, agent collaboration, and distributed AI fabric.  
5. Honesty flags: `multiCloudAgentOs` / `langGraphOs` / `distributedAiFabric` = false; `loadBearingE2e` / `executesRealRequests` = true.

## Consequences

- Intelligence Cloud marks orchestration `partial` with hub links.  
- Intelligence Analytics (VL-191) aggregates for this cloud (ADR-0102), not regenerating Language/Speech/Voice analytics.
