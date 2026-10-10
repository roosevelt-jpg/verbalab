# ADR-0120: Batch Runtime (BullMQ hub + sandbox runs, not Spark/Airflow)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-209 (library “Phase 76 Batch Runtime” mapped)

## Context

Library Phase 76 asks for Batch Runtime covering translation/speech/OCR/embedding/training/video jobs plus scheduling, retry, checkpointing, priority queues, engine/REST/SDK/dashboard/analytics and production deployment.

Lugemi already runs async work via BullMQ (`POST /v1/jobs` for `batch_translate`, document translate, workflows) and has a training-jobs API. Inventing a Spark/Airflow/Celery OS would violate extend-don’t-regenerate.

## Decision

1. Ship `/v1/batch-runtime/*` + `/batch-runtime` as a batch **catalog + run hub**.
2. Translation runs **delegate** to existing `JobsService.create(batch_translate)`.
3. Speech/OCR/embedding runs are **sandbox logical** item batches with checkpoint cursors.
4. Training is linked, not reimplemented; video batch deferred.
5. Support `priority` (low/normal/high), `runAt` scheduling + `/start`, `/checkpoint`, `/retry` with hard ceilings (`LUGEMI_BATCH_MAX_ITEMS`, `LUGEMI_BATCH_MAX_RETRIES`).
6. Flip Inference Cloud catalog `batch-runtime` to expose engine/console; deferred product flag → false.

## Consequences

- One hub discovers batch surfaces and exercises priority/retry/checkpoint without a new distributed scheduler.
- Jobs API remains source of truth for translation batch execution.
- Cost Optimization (VL-211) still owns spend enforcement for expensive batch fan-out.
