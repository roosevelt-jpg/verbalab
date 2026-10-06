# VerbaLab Batch Runtime

**Status:** Partial (VL-209 / library Phase 76)  
**Parent:** [Inference Cloud](./INFERENCE_CLOUD.md)  
**Rule:** Batch hub over existing **BullMQ `/v1/jobs`** for translation, plus **sandbox runs** for speech/OCR/embedding with priority, retry budget, and checkpoint cursors. Authed runs are org/workspace-scoped. Does **not** invent Spark/Airflow/Celery OS or video batch fabric. Does **not** regenerate the jobs or training-jobs APIs.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/batch-runtime` |
| Engine | `GET /v1/batch-runtime/engine` |
| Kinds | `GET /v1/batch-runtime/kinds` |
| Runs | `GET/POST /v1/batch-runtime/runs` |
| Start / checkpoint / retry | `POST …/runs/:id/{start,checkpoint,retry}` |
| Analytics / monitoring | `GET …/analytics` · `/monitoring` |
| GraphQL | `batchRuntimeEngine` |
| SDK / CLI | `batchRuntimeEngine()` · `verbalab batch-runtime-engine` |

## Library map

| Ask | Status |
| --- | --- |
| Translation Jobs | partial — delegates to `batch_translate` |
| Speech / OCR / Embedding Jobs | partial — sandbox item processing |
| Training Jobs | partial — links `POST /v1/training-jobs` |
| Video Jobs | deferred |
| Scheduling | partial — `runAt` + `/start` |
| Retry | partial — hard `maxRetries` budget |
| Checkpointing | partial — item-index cursor |
| Priority Queues | partial — low/normal/high weights |

## Env

| Control | Default | Env |
| --- | --- | --- |
| Mode | `sandbox` | `VERBALAB_BATCH_RUNTIME_MODE=disabled\|sandbox` |
| Max items / run | 50 (cap 100) | `VERBALAB_BATCH_MAX_ITEMS` |
| Max retries | 2 (cap 5) | `VERBALAB_BATCH_MAX_RETRIES` |

## Honesty

| Flag | Value |
| --- | --- |
| `sparkOs` / `airflowOs` / `celeryOs` | false |
| `distributedBatchOs` | false |
| `videoBatchOs` | false |
| `regeneratesJobsApi` | false |
| `extendsBullMqJobs` | true |
| `cronSchedulerOs` | false |

See ADR-0120.
