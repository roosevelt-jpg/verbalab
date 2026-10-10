# ADR-0154: Dataset Marketplace (extends dataset kind, not Label Studio)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-252 (library “Phase 119 Dataset Marketplace” mapped)

## Context

Library Phase 119 asks for a Dataset Marketplace covering public/enterprise/research datasets, translation/speech/OCR/vision corpora, licensing, versioning, reviews, revenue sharing, REST/SDK/dashboard/monitoring/docs.

Volume 11 requires real-money honesty. Content marketplace already ships `kind=dataset` from approved TM (VL-091). VL-101 DatasetAsset is licensed corpus intake. Inventing Label Studio / Dataset Cloud would violate “extend, don’t regenerate.”

## Decision

1. **Ship VL-252** as `/dataset-marketplace` over `MarketplaceListing` `kind=dataset` with hub marker `snapshot.hub=dataset-marketplace`.  
2. **Sources:** `tm_corpus` (approved TM pairs) and `dataset_asset` (VL-101).  
3. **Install:** TM copies pairs into buyer workspace; DatasetAsset grants license entitlement (no file re-host OS).  
4. **Categories** encode public/enterprise/research/translation/speech/ocr/vision.  
5. **Revenue sharing** records `MarketplaceSale` with 15% platform fee.  
6. **FabricPolicyGate** on `dataset-marketplace` bus.  
7. Honesty: `labelStudioOs: false`, `datasetCloudOs: false`, `storesRawCardData: false`, `stripeOrEquivalentRequired: true`.

## Consequences

- Ecosystem catalog marks Dataset Marketplace shipped.  
- Legacy VL-091 listings without hub marker remain on content marketplace only.  
- Prompt Marketplace (VL-253) can mirror this hub pattern next.
