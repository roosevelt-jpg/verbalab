# ADR-0024: Resend notifications

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-080

## Context

Async jobs and billing need email: job complete, usage thresholds, and membership welcome. We will not build a Notification Cloud.

## Decision

1. **Provider:** Resend via thin `ResendAdapter` (`fetch`); no-op when `RESEND_API_KEY` / `EMAIL_FROM` unset. `NOTIFICATIONS_DISABLED=1` kills sends.
2. **Triggers:** `job.succeeded` / `job.failed` → owners/admins; translate usage at **80%** and **100%** of monthly character quota (deduped per billing period via audit actions); new Clerk-synced membership → welcome email to the member.
3. **Invites:** Clerk Organizations remain the invite IdP; Lugemi does not ship invite CRUD.
4. **Tests:** `setProviderForTests` memory mailbox; never call live Resend in CI.

## Consequences

- Missing owner emails means job/usage alerts are skipped (threshold still audited when possible).
- Preference UI / digests deferred (VL-081 if needed).
