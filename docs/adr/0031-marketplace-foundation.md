# ADR-0031: Marketplace foundation (glossary listings)

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-090

## Context

M9 needs a shareable asset surface. Glossaries are org-owned and useful across tenants. TTS voices are vendor catalogs, not org assets. Payouts (VL-092) and extra listing kinds (VL-091) come later. Roadmap gate: paying customers — enforced as Pro plan.

## Decision

1. **Kind:** `glossary` only. Publish freezes a JSON snapshot of the publisher workspace terms.
2. **Tables:** `marketplace_listings` (publisher org/workspace, title, status, snapshot) and `marketplace_installs` (unique per listing + installer workspace) as entitlement receipts.
3. **Install:** Copy-on-install into the buyer workspace via glossary upsert (overwrite conflicting source terms). No live link to the publisher.
4. **Gate:** `BillingService.assertPro` on list/publish/install/unpublish. Owner/admin for writes.
5. **Console:** `/marketplace`. Unpublish sets `status=unpublished` (installs kept).

## Consequences

- Publisher edits after publish do not change existing listings or buyer glossaries.
- Free orgs get `402 plan_required`.
- Voices, prompts, datasets, and Stripe Connect remain out of scope.
