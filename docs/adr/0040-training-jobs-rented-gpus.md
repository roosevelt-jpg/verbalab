# ADR-0040: Training jobs on rented GPUs

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-111

## Context

VL-104 recorded fine-tune jobs with a Modal stub that never succeeded. VL-110 tracks live adapters. Operators need a Job API that can launch training on **bought** GPU clouds (Modal/Vertex) or stay manual, then record artifacts — without an internal GPU platform.

## Decision

1. **Same table:** Continue `fine_tune_jobs` (VL-104). Add `datasetAssetId`, `callbackToken`, `providerMeta`, `startedAt` / `finishedAt`.
2. **Launchers:** `manual` (default), `modal` (MODAL_TOKEN_* + **MODAL_LAUNCH_URL** webhook), `vertex` (VERTEX_LAUNCH_URL + token), `fixture` (`TRAINING_FIXTURE=1` for CI only).
3. **Buy pattern:** Lugemi POSTs pack metadata + callback URL to the customer's Modal/Vertex webhook; the cloud POSTs back to `POST /v1/training-jobs/callback` with `X-Lugemi-Training-Token`. No fake GPU success without HTTP acknowledgement.
4. **API:** `/v1/training-jobs` (list/create/launch/complete/launchers + public callback). `/v1/finetunes/jobs*` remains compatible.
5. **Out of scope:** Kubernetes device plugins, internal GPU clusters, foundation-model training (VL-112).

## Consequences

- Manual remains the honest default when Modal/Vertex URLs are unset (job → `awaiting_gpu`).
- CI proves launch → callback → registry promote via fixture launcher.
- Real Modal/Vertex wiring is an env + webhook contract, not an in-tree SDK.
