# ADR-0032: Marketplace listing kinds (prompts + datasets)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-091

## Context

VL-090 shipped glossary-only listings. The roadmap asks for prompts and datasets on the same foundation before creator payouts (VL-092). There is no Dataset Cloud yet (VL-101).

## Decision

1. **Kinds:** `glossary` | `prompt` | `dataset` on existing `marketplace_listings` / `marketplace_installs`.
2. **prompt:** Snapshot active managed prompt bodies (`chat`, `rag`, `voice_faq`). Install creates a new `PromptVersion` per key and activates it.
3. **dataset:** Snapshot approved TM entries (parallel pairs, max 500). Install upserts into buyer TM. Honors `persistSourceText=false`. Full dataset program remains VL-101.
4. **API:** `kind` on publish; optional `?kind=` filter on list. Responses expose `itemCount` / `itemsInstalled` (aliases of term fields).
5. **Console:** Kind selector + catalog filter on `/marketplace`.

## Consequences

- Dataset listings are TM-backed until VL-101 storage exists.
- Prompt installs do not delete prior versions; they append and activate.
- Payouts and paid listings stay VL-092.
