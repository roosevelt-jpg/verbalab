# Lugemi AI Runtime Analytics

**Status:** Partial (VL-212 / library Phase 79)  
**Parent:** [Inference Cloud](./INFERENCE_CLOUD.md)  
**Rule:** Org/workspace **aggregates** for Inference Cloud runtime (latency, throughput, GPU/CPU, cache, requests, errors, cost, customers, models, streaming). Does **not** invent a BI dashboard OS, APM suite, or cloud GPU telemetry OS. Does **not** regenerate Intelligence Analytics (VL-191) or Knowledge Analytics (VL-202).

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/ai-runtime-analytics` |
| Engine | `GET /v1/ai-runtime-analytics/engine` |
| Overview / report | `GET …/overview` · `/report` |
| Latency / throughput | `GET …/latency` · `/throughput` |
| GPU / CPU | `GET …/gpu` · `/cpu` |
| Cache / requests / errors | `GET …/cache` · `/requests` · `/errors` |
| Cost / customers / models / streaming | `GET …/cost` · `/customers` · `/models` · `/streaming` |
| Monitoring | `GET …/monitoring` |
| GraphQL | `aiRuntimeAnalyticsEngine` |
| SDK / CLI | `aiRuntimeAnalyticsEngine()` · `lugemi ai-runtime-analytics-engine` |

## Sources

GPU Platform · AI Router · Streaming Runtime · Batch Runtime · Intelligent Cache · Cost Optimization · Model Serving · `usage_events` · audit metadata (when latency present)

## Honesty

| Flag | Value |
| --- | --- |
| `biDashboardOs` | false |
| `apmOs` | false |
| `cloudGpuTelemetryOs` | false |
| `regeneratesIntelligenceAnalytics` | false |
| `regeneratesKnowledgeAnalytics` | false |
| `aggregatesOnly` | true |

Spend enforcement remains [Cost Optimization](./COST_OPTIMIZATION.md) (VL-211). See ADR-0123.
