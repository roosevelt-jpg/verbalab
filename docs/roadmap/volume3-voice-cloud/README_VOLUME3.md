# VerbaLab — Volume 3: Voice Cloud (Phases 27–36)

Same workflow as Volumes 1 and 2. `.cursorrules` at the repo root still applies.
This builds Voice Cloud on top of everything from Volumes 1–2 — remind Cursor
of that in your first message so it extends rather than rebuilds.

## Run phases in order

| # | Phase | What it builds |
|---|---|---|
| 00 | 27 Voice Cloud Foundation | Base infra for all voice products |
| 01 | 28 Neural Text-to-Speech | Core TTS engine |
| 02 | 29 Voice Cloning Platform | Custom voice model creation |
| 03 | 30 Emotion Voice Engine | Emotional/expressive TTS |
| 04 | 31 Voice Studio | Editing/production UI for voice content |
| 05 | 32 Voice Enhancement Platform | Audio cleanup/enhancement |
| 06 | 33 Voice Biometrics | Voice-based identity verification |
| 07 | 34 Voice Marketplace | Buy/sell/share custom voices |
| 08 | 35 Voice Analytics | Usage/quality analytics |
| 09 | 36 Voice Cloud Production Audit | Hardening pass — review, don't add features |

## One thing worth flagging on this volume specifically

Phases 29 (Voice Cloning) and 33 (Voice Biometrics) are the kind of features
that get abused if built without guardrails — cloned voices used for fraud/
impersonation, biometric data mishandled. When Cursor builds these, actually
check that it's implementing:
- Explicit consent capture before cloning anyone's voice (not just a checkbox
  buried in ToS)
- Audit logging on who cloned/used which voice
- Some form of provenance/watermarking on generated audio if feasible
- Biometric data encrypted at rest, with a clear deletion path

Your Volume 1 build already has Identity/Trust foundations — make sure Cursor
actually wires these features into them rather than treating consent/audit as
an afterthought. Worth a manual read of the diff on these two phases specifically,
not just a skim.

## Same process as before

1. New Cursor Agent conversation per phase.
2. Paste the file content below the `<!-- PASTE... -->` line.
3. Review the diff, actually run it, confirm it works.
4. Commit.
5. Next file.

## After Phase 36

Three real product clouds now: Language, Speech, Voice. Good time to pause
again before Volume 4 (Vision Cloud / OCR, Phases 37–46) — same advice as
before: stabilize, use it, fix what's broken. Ask when you're ready for
Volume 4.
