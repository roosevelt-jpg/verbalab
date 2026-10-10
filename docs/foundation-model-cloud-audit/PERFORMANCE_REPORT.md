# Foundation Model Cloud — Performance Report (VL-238)

**Date:** 2026-10-03

## Verdict

Bounded smoke latencies only. **No invented k6/GPU-cluster benchmark lab.**

## Observations

| Path | Expectation |
| --- | --- |
| `GET /v1/foundation-model-cloud/products` | Catalog JSON — milliseconds in-process |
| `GET /v1/model-training-platform/engine` | Catalog + launcher status — no GPU |
| `GET /v1/model-evaluation-platform/engine` | Catalog + coverage snapshot read |
| `GET /v1/model-registry/engine` | Catalog + VL-110 live matrix query |

## Ceilings (honesty)

- Training experiments / eval runs / registry versions use sandbox ceilings (see each platform catalog).
- Real GPU spend remains gated by VL-111 Pro + Cost Optimization + rented-GPU callbacks.
- Live MT eval remains opt-in (`EVAL_LIVE=1`).

## Rejected

- Synthetic “Atlas tokens/sec” claims  
- Fabric-wide distributed tracing OS invented here
