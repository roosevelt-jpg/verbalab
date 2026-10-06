# VerbaLab Plugin Marketplace

**Status:** Shipped (VL-250 / library Phase 117)  
**Rule:** Third-party plugins from the marketplace **must not execute** until Plugin Runtime sandbox + Policy gates allow. `liveCodeExecution: false`. Not a browser/VS Code extension store OS. Roadmap: [`docs/roadmap/volume11-ecosystem-cloud/`](./roadmap/volume11-ecosystem-cloud/).

Volume 11 README: Plugin Marketplace sells code that runs on the platform — Volume 8 Plugin Runtime sandboxing/review must be enforced before marketplace plugins run for other users.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Plugin Publishing | **Shipped** — listing over Plugin Runtime plugin snapshot (`kind=plugin`) |
| Plugin Installation | **Shipped** — register + activate in buyer workspace via Plugin Runtime |
| Plugin Updates / Versioning | **Shipped** — bump via Plugin Runtime version → listing update |
| Plugin Security | **Shipped** — FabricPolicyGate + PluginPolicyGate + sandbox invoke |
| Plugin Reviews / Ratings | **Shipped** — MemoryRecord reviews + snapshot aggregates |
| Plugin Analytics | **Partial** — listing/install/sale/run counts |
| Plugin Monetization | **Partial** — MarketplaceSale receipts; Stripe Connect via VL-092 |
| Plugin Verification | **Shipped** — permissions ⊆ allowlist; denied actions rejected |
| Live/arbitrary code plugins | **Forbidden** — `liveCodeExecution: false` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/plugin-marketplace` |
| REST engine | `GET /v1/plugin-marketplace/engine` |
| REST listings | `GET/POST /v1/plugin-marketplace/listings` |
| Install | `POST /v1/plugin-marketplace/listings/:id/install` |
| Run (gated) | `POST /v1/plugin-marketplace/listings/:id/run` |
| Reviews | `GET/POST /v1/plugin-marketplace/listings/:id/reviews` |
| Analytics / monitoring | `GET /v1/plugin-marketplace/analytics`, `/monitoring` |
| GraphQL | `pluginMarketplaceEngine` |
| SDK | `pluginMarketplaceEngine()` |
| CLI | `verbalab plugin-marketplace-engine` |

## Execution safety

1. **Publish** — FabricPolicyGate (`plugin-marketplace` / `marketplace.publish`) + PluginPolicyGate (`plugin.read`) + permission verification.
2. **Install** — FabricPolicyGate (`marketplace.install`) → Plugin Runtime `register` + `lifecycle(active)` → PluginPolicyGate verify.
3. **Run** — FabricPolicyGate (`marketplace.invoke`) → **only** `PluginRuntimeService.invoke` (PluginPolicyGate per step + sandboxed handlers). Denied actions (`shell.exec`, `network.fetch`, `plugin.invoke_live`, …) → **403**.

## Honesty

| Flag | Value |
| --- | --- |
| `liveCodeExecution` | false |
| `sandboxRequired` | true |
| `pluginPolicyHardGateRequired` | true |
| `fabricPolicyHardGateRequired` | true |
| `browserExtensionOs` | false |
| `regeneratesPluginRuntime` | false |
| `paymentProcessorOs` | false |

See ADR-0152. Runtime: [`PLUGIN_RUNTIME.md`](./PLUGIN_RUNTIME.md). Ecosystem hub: [`ECOSYSTEM_CLOUD.md`](./ECOSYSTEM_CLOUD.md).
