# AI Kernel — Deployment Guide (VL-223)

This guide points at the **existing** production paths. AI Kernel ships inside the API/web containers; there is no separate Kernel deployable.

## Paths

1. **Fly.io (default)** — [`infra/DEPLOY.md`](../../infra/DEPLOY.md)
2. **AWS EKS `af-south-1` (optional)** — [`infra/AWS_EKS.md`](../../infra/AWS_EKS.md)

## Pre-flight

1. Apply migrations (`prisma migrate deploy` / Fly `release_command`) — Kernel reuses MemoryRecord + audit tables (no new Kernel migration required through VL-222).
2. Ensure Postgres is reachable; Redis (`REDIS_URL`) for rate limits/jobs — do not use `JOBS_INLINE=1` in production.
3. Configure Clerk + `CORS_ORIGIN`.
4. Configure vendor keys for Gateway paths used by Reasoning/Context (`OPENAI_API_KEY`, etc.).
5. Prefer sandbox/enforce modes:
   - `VERBALAB_AGENT_RUNTIME_MODE=sandbox`
   - `VERBALAB_WORKFLOW_RUNTIME_MODE=sandbox`
   - `VERBALAB_PLUGIN_RUNTIME_MODE=sandbox`
   - `VERBALAB_POLICY_RUNTIME_MODE=enforce`
6. Optional: Stripe for plan entitlements.

## Post-deploy smoke

```bash
curl -sS "$API/v1/ai-kernel/products" | head
curl -sS "$API/v1/memory-runtime/engine"
curl -sS "$API/v1/prompt-runtime/engine"
curl -sS "$API/v1/context-runtime/engine"
curl -sS "$API/v1/reasoning-runtime/engine"
curl -sS "$API/v1/agent-runtime/engine"
curl -sS "$API/v1/workflow-runtime/engine"
curl -sS "$API/v1/plugin-runtime/engine"
curl -sS "$API/v1/policy-runtime/engine"
curl -sS "$API/health"
```

Authenticated (API key): create a sandbox agent, activate, `POST /v1/agent-runtime/run` with `reason.plan` only; create a Policy deny on a granted action and confirm the Agent run step is denied.

## Console

Internal consoles: `/ai-kernel`, `/memory-runtime`, `/prompt-runtime`, `/context-runtime`, `/reasoning-runtime`, `/agent-runtime`, `/workflow-runtime`, `/plugin-runtime`, `/policy-runtime`.
