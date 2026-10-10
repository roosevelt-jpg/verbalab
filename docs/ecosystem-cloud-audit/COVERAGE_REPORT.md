# Ecosystem Cloud — Coverage Report (VL-259)

## Spec coverage (vitest)

| Spec | VL | Focus |
| --- | --- | --- |
| `ecosystem-cloud.spec.ts` | 249 | Hub catalog + GraphQL |
| `plugin-marketplace.spec.ts` | 250 | Sandbox publish/install/run |
| `model-marketplace.spec.ts` | 251 | License SKUs |
| `dataset-marketplace.spec.ts` | 252 | Dataset hub |
| `prompt-marketplace.spec.ts` | 253 | Prompt hub |
| `agent-marketplace.spec.ts` | 254 | Sandbox agent run |
| `workflow-marketplace.spec.ts` | 255 | Sandbox workflow run |
| `connector-marketplace.spec.ts` | 256 | Connector entitlements |
| `voice-language-marketplace.spec.ts` | 257 | Pack entitlements |
| `creator-economy.spec.ts` | 258 | Royalty hand-checks |
| `ecosystem-cloud-audit.spec.ts` | 259 | Volume audit gate |

## Surfaces covered

- REST engine/products/monitoring/listings/install/sales/analytics per marketplace
- Creator Economy royalty/profiles/invoices/tax/disputes
- GraphQL CQRS engine queries
- SDK/CLI engine helpers
- Web consoles under `/ecosystem-cloud` … `/creator-economy`
- Docs + ADRs 0151–0161

## Gaps (honest)

- Live Stripe Connect payouts not covered without Stripe env
- Tax/1099/VAT and dispute UI not covered (deferred)
- Load-test lab / chaos engineering OS not covered (sandbox latency smokes only)
- Digital Twin Platform not covered (rejected in this audit)
