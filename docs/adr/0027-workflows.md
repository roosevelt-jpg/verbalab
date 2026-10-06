# ADR-0027: Workflows as JSON job steps

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-083

## Context

Contact-center and localization pipelines need directed steps (e.g. transcribe → translate → notify). We will not build Temporal, visual BPMN, or a Zapier competitor.

## Decision

1. **Job type `workflow`** — steps stored as JSON on the job (and optionally as a saved `Workflow` definition). Executed sequentially inside the existing BullMQ / inline job runner.
2. **Allowlisted ops only:** `transcribe` (documentId → STT), `translate` (text with `{{stepId.field}}` placeholders), `notify` (email to owners/admins or signed webhook). Max 10 steps; fail-fast.
3. **APIs:** Clerk CRUD on `/v1/workflows`; run via `POST /v1/workflows/{id}/run` or `POST /v1/jobs` with `type: "workflow"`. Console `/workflows` edits JSON recipes.
4. **Out of scope:** branching, retries-per-step, visual editor, OCR/TTS as first-class ops (can add later).

## Consequences

- Audio for `transcribe` must already exist as an org-owned `Document`.
- Job-complete email still fires for the whole run; `notify` is an explicit mid/end step.
