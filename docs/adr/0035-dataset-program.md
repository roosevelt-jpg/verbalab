# ADR-0035: Dataset program (intake + storage)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-101

## Context

Fine-tunes (VL-104) need licensed corpora with consent and PII handling. Marketplace `dataset` listings (ADR-0032) are TM snapshots only. Building Label Studio or Dataset Cloud is out of scope.

## Decision

1. **Tables:** `dataset_assets` (title, licenseTag, consentNotes, containsPii, partner, langs, status) + `dataset_versions` (versioned file blobs).
2. **Storage:** Local disk via `LocalStorageService` under `datasets/{orgId}/{assetId}/…` (same root as documents). S3 deferred.
3. **API / console:** Clerk owner/admin — create/list/patch/archive, add version, download. Console `/datasets`.
4. **Governance:** Export includes metadata (not bytes); org delete unlinks dataset files.
5. **Annotation:** Use Label Studio (or peers) externally; VerbaLab stores finished artifacts + legal metadata only.
6. **Boundary:** Do not auto-publish DatasetAsset to marketplace.

## Consequences

- Required consent + known license tags on intake.
- Partner university MOUs are free-text references, not a contracts product.
- Eval goldens (VL-100) can later import licensed packs from this store.
