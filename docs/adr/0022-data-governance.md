# ADR-0022: Data governance

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-073

## Context

Government and bank RFPs need retention controls, export, deletion, and a DPA-ready data map — not a “Trust Cloud”.

## Decision

1. **Org settings:** `retentionDays` (null = keep), `persistSourceText` (default true), `allowVendorTraining` (default false).
2. **APIs (Clerk):** `GET/PATCH /v1/organization/data-settings`, `POST /v1/organization/export`, `DELETE /v1/organization` (owner + `confirmName`).
3. **persistSourceText=false:** quality reviews store `[redacted]`; TM upserts forbidden; translation_requests stay metadata-only.
4. **Delete:** Prisma cascade for org-scoped rows; best-effort unlink of document/knowledge files. Clerk/Stripe sync out of scope.
5. **Data map:** `docs/data-map.md` for DPA annexes. Automated retention sweeper deferred.

## Consequences

- `org.deleted` audit row is cascade-removed with the org; rely on JSON request logs for durable delete evidence.
- Export redacts TM/reviews when persist is off; knowledge file bytes are not embedded in the JSON export.
