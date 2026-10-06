# Lugemi Plugin Runtime

**Status:** Partial shipped (VL-221 / library Phase 88)  
**Rule:** Plugins require **scoped permissions** and **sandboxing**. Missing permissions and globally denied actions are **hard-blocked**. Not live arbitrary code/network plugins. Not a browser/VS Code extension OS. Extends marketplace — does not regenerate it.

Part of the internal [AI Kernel](./AI_KERNEL.md) (Volume 8). Roadmap: [`docs/roadmap/volume8-ai-kernel/`](./roadmap/volume8-ai-kernel/).

---

## Safety (README Volume 8)

1. Every action passes `PluginPolicyGate` (local hard allowlist) before execution.
2. Globally denied: `external.execute`, `shell.exec`, `network.fetch`, `plugin.invoke_live`, …
3. Allowed actions run as **simulated sandbox handlers** — `liveCodeExecution: false`.
4. Policy Runtime (VL-222) is wired (`policyRuntimeWired: true`) — org/global denies hard-block via `PluginPolicyGate`.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Plugin Registry | **Shipped** — kernel MemoryRecords |
| Plugin Sandbox | **Shipped** — simulated handlers only |
| Plugin Security | **Shipped** — hard allowlist gate |
| Plugin Versioning | **Shipped** — version bump + history records |
| Plugin Marketplace | **Partial** — listing counts when kind=plugin |
| Plugin Dependencies | **Partial** — declared ids must exist/active |
| Plugin Permissions | **Shipped** — hard allowlist |
| Plugin Lifecycle | **Shipped** — draft/active/paused/archived |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/plugin-runtime` |
| REST engine | `GET /v1/plugin-runtime/engine` |
| Plugins | `GET\|POST /v1/plugin-runtime/plugins` |
| Invoke | `POST /v1/plugin-runtime/invoke` |
| Marketplace | `GET /v1/plugin-runtime/marketplace` |
| GraphQL | `pluginRuntimeEngine` |
| SDK | `pluginRuntimeEngine()`, `pluginRuntimeRegister()`, `pluginRuntimeInvoke()` |
| CLI | `lugemi plugin-runtime-engine` |

## Grantable permissions

`plugin.read`, `plugin.transform`, `memory.put`, `memory.search`, `reason.plan`, `context.assemble`, `plugin.notify`

See ADR-0132.
