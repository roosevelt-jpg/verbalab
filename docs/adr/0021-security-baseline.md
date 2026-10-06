# ADR-0021: Security baseline

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-072

## Context

Language data is confidential. We need a thin trust baseline without a “Security Cloud”.

## Decision

1. **API keys at rest:** SHA-256 hash of the full `vl_live_…` secret (`hashApiKey`). Plaintext returned once at create; list/revoke expose prefix only. Not reversible encryption — hashing is intentional.
2. **Tenant isolation:** All org-scoped reads filter by `organizationId` from auth context. Tests assert org B cannot fetch org A jobs/knowledge and cannot revoke org A keys.
3. **Security headers:** `helmet` on the Nest API; Next.js `headers()` for frame/nosniff/referrer/permissions/CSP (Clerk-compatible).
4. **CI:** Gitleaks secret scan + `pnpm audit --prod` (high+). No self-hosted SIEM.

## Consequences

- CSP must allow Clerk script/connect hosts; tighten when domains are fixed.
- Audit findings may block CI until dependencies are upgraded or allowlisted.
