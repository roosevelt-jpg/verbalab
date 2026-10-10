# Lugemi — Volume 2: Speech Cloud (Phases 16–26)

Same workflow as Volume 1. Your existing `.cursorrules` at the repo root still
applies — no changes needed there. This builds Speech Cloud **on top of** your
existing Language Cloud, Identity, AI Gateway, and platform foundations.

**Do not let Cursor regenerate anything from Volume 1.** These prompts assume
Phases ‑1 through 15 already exist and work. If Cursor starts recreating
identity/gateway/console code, stop it and remind it to extend, not rebuild.

## Run phases in order

| # | Phase | What it builds |
|---|---|---|
| 00 | 16 Speech Cloud Foundation | Base infra for all speech products |
| 01 | 17 Speech Recognition Engine | Core speech-to-text |
| 02 | 18 Speaker Intelligence | Speaker ID / diarization |
| 03 | 19 Accent Intelligence | Accent detection/adaptation |
| 04 | 20 Emotion Intelligence | Emotion detection from audio |
| 05 | 21 Audio Intelligence | General audio analysis |
| 06 | 22 Pronunciation Intelligence | Pronunciation scoring/feedback |
| 07 | 23 Wake Word & Keyword Intelligence | Wake-word/keyword spotting |
| 08 | 24 Call Intelligence | Call analytics (contact-center use cases) |
| 09 | 25 Speech Analytics | Usage/quality analytics for Speech Cloud |
| 10 | 26 Speech Cloud Production Audit | Hardening pass — review, don't add features |

## Same process as before

1. New Cursor Agent conversation per phase.
2. Paste the file content below the `<!-- PASTE... -->` line.
3. Review the diff, actually run it, confirm it works.
4. Commit.
5. Next file.

## After Phase 26

You'll have Speech Cloud sitting alongside Language Cloud — a real multi-product
platform. Good point to pause again: use it, fix rough edges, don't rush into
Volume 3 (Voice Cloud, Phases 27–36) until this one is solid. When you're
ready for it, ask and I'll cut the same kind of pack.
