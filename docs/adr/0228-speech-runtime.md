# ADR-0228: Speech Runtime (VL-326)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-326 (library Phase 193)

## Context

Volume 18 builds Data Plane Cloud as the execution layer for workloads. Risk: duplicating
Translation/Speech/Voice/Vision/Knowledge/Embedding product logic already shipped in
Volumes 1–7, inventing Service Mesh / architecture-freeze OS / VAIOS, or managing
orgs/policies/billing (Control Plane concerns).

## Decision

1. Ship `speech-runtime` as a Nest hub with catalog + service + controller + CQRS + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`thinExecutionLayer=true`; `duplicatesProductLogic=false`; `managesOrgsPoliciesBilling=false`; `serviceMeshOs=false`).
3. Route to existing product modules — do not copy-paste MT/STT/TTS/OCR/RAG business logic.
4. Reject Service Mesh / VAIOS invention in this volume.

## Consequences

- Speech Runtime is discoverable under Data Plane Cloud Foundation.
- Operators can inspect routing catalogs with explicit thin-layer honesty.
