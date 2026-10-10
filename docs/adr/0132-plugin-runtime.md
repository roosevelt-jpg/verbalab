# ADR-0132: Plugin Runtime (sandbox + hard permissions, not extension OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-221 (library “Phase 88 Plugin Runtime” mapped)

## Context

Library Phase 88 asks for Plugin Runtime with registry, sandbox, security, versioning, marketplace, dependencies, permissions, lifecycle, plus REST/SDK/dashboard/monitoring/docs.

Volume 8 README requires scoped permissions and sandboxing — open plugin invoke against real accounts/data is unsafe. Inventing a browser/VS Code/WASM extension OS would violate “extend, don’t regenerate.”

## Decision

1. **Ship** `/v1/plugin-runtime/*` as the AI Kernel plugin surface (VL-221).
2. **Hard allowlist** via `PluginPolicyGate` — missing permission or globally denied action → deny.
3. **Sandbox invoke only** — read/transform/notify/memory/plan/context; `liveCodeExecution: false`.
4. **Extend** marketplace via listing counts (`kind=plugin`) — do not replace marketplace product.
5. **Dependencies** = declared plugin ids that must exist and be active — not a package manager OS.
6. **Policy Runtime** not fully wired yet (`policyRuntimeWired: false`) but local hard gate is mandatory from day one.
7. **Flip** AI Kernel catalog `plugin-runtime` → `partial`; `deferred.pluginRuntime` → false.

## Consequences

- Plugin Runtime is safe-by-default for demos without live code execution.
- VL-222 Policy Runtime must become the shared hard gate Agent/Workflow/Plugin already call conceptually.
