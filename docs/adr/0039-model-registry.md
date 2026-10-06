# ADR-0039: Model registry (buy)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-110

## Context

Operators need to know which provider/model is live per gateway feature. VL-104 added a thin `model_registry` for pair fine-tunes. Building MLflow or a custom MLOps cloud is out of scope; Weights & Biases (or vendor docs) can be linked externally.

## Decision

1. **Extend `model_registry`:** `kind` (`vendor` | `finetune` | `http`), optional `provider`, nullable langs/artifacts for vendors, optional `externalUrl` / `notes`.
2. **Seed bought defaults** on boot for translate/STT/TTS/OCR/detect/chat/embeddings (Google/OpenAI/franc).
3. **Public** `GET /v1/models/live` matrix with credential/artifact `configured` flags. Clerk list/get; platform-admin mutations for status + external URL.
4. **Fine-tunes** remain `kind=finetune` and pair-routed in the gateway (ADR-0038); promoting a finetune does not retire vendor defaults.
5. **Out of scope:** MLflow, experiment tracking UI, automatic weight deploy.

## Consequences

- One table tracks vendors and fine-tunes without a second product.
- Missing API keys show as not configured — no fake readiness.
- Fuller training job automation stays VL-111.
