# AI Fabric — Coverage Report (VL-248)

## Spec coverage (vitest)

| Spec | VL | Focus |
| --- | --- | --- |
| `ai-fabric.spec.ts` | 239 | Hub catalog + GraphQL |
| `event-fabric.spec.ts` | 240 | Streams / CloudEvents |
| `context-fabric.spec.ts` | 241 | Router + SSE |
| `knowledge-fabric.spec.ts` | 242 | Distribute/sync |
| `prompt-fabric.spec.ts` | 243 | Validate/version/sync |
| `reasoning-fabric.spec.ts` | 244 | Pipelines/replay |
| `memory-fabric.spec.ts` | 245 | Sync/replicate |
| `agent-fabric.spec.ts` | 246 | Discovery/SSE/sandbox |
| `policy-fabric.spec.ts` | 247 | Hard gate 403 |
| `ai-fabric-audit.spec.ts` | 248 | Volume audit gate |

## Surfaces covered

- REST products/engine/routes/route/pipeline/monitoring/overview per fabric
- GraphQL CQRS capability/route queries
- SDK/CLI product + route helpers
- Web consoles under `/ai-fabric` … `/policy-fabric`
- Docs + ADRs 0141–0150

## Gaps (honest)

- Kafka/NATS/Rabbit adapters not covered (deferred)
- Cross-org federation not covered (forbidden by honesty)
- Live multi-region chaos not covered (sandbox resilience smokes only)
