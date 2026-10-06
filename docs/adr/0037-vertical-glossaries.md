# ADR-0037: Vertical starter glossaries

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-103

## Context

Domain accuracy for public-sector, healthcare, and banking buyers needs starter terminology. Workspace glossaries (VL-050) and marketplace glossary listings (VL-090) already exist. Dataset Cloud / Domain Glossary Cloud are out of scope.

## Decision

1. **Platform packs** seeded in code: `public-sector`, `healthcare`, `banking` for EN→sw (~25 terms each).
2. **Install:** Pro orgs copy terms into workspace `glossary_terms` via shared upsert helper (same as marketplace). Receipt in `vertical_glossary_installs`.
3. **API:** Clerk `GET /v1/vertical-glossaries` (preview for all), `POST …/install` (Pro), installs list.
4. **Console:** Starter packs section on `/glossary`.
5. **Boundary:** Not marketplace creator listings; not DatasetAsset storage.

## Consequences

- Free orgs can preview; install requires Pro (bundled entitlement).
- Re-install upserts terms and refreshes the receipt.
- Additional language pairs can be added as new seed packs later.
