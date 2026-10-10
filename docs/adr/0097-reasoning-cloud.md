# ADR-0097: Reasoning Cloud (LLM gateway strategies, not a custom kernel)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-186 (library “Phase 53 Reasoning Cloud” mapped)

## Context

Library Phase 53 asks for chain/tree/graph reasoning, multilingual reasoning, planning, decision making, problem solving, tool selection, knowledge retrieval, and agent reasoning plus REST/GraphQL/SDK, dashboard, monitoring, docs, and production deployment.

ROADMAP VL-186: multi-step reasoning via LLM gateway prompts/tools — **not** a custom reasoner kernel. Out of scope: proprietary symbolic reasoner OS. Depends on VL-180 and VL-060 (chat).

## Decision

1. Ship **Reasoning Cloud** hub under `/v1/reasoning-cloud/*` + console `/reasoning-cloud`.  
2. Implement **`POST /reason`** as prompt strategies over `GatewayService.chat`, metered via chat usage.  
3. Default **`retrieve=true`** to pull Context Engine context before reasoning.  
4. Tree-of-thought = shallow 2-branch generate + pick (honest partial).  
5. Tool selection returns catalog suggestions only — **no tool execution**.  
6. Keep `customReasonerKernel` / `symbolicReasonerOs` honesty flags false; Intelligence `customReasoner` deferred flag remains true.

## Consequences

- Chat remains the OpenAI-shaped completions API; Reasoning Cloud is the strategy hub.  
- Recommendation Engine (VL-187) is next and must stay a light ranker, not a retail recommender OS.  
- Full agent OS / tool runtime stays deferred to later orchestration work.
