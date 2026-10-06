# VerbaLab — Volume 18: Data Plane Cloud (Phases 191–200)

Same workflow as Volumes 1–17. `.cursorrules` at the repo root still applies.

## The real risk in this volume isn't security — it's duplication

Unlike Volume 17 (Control Plane), this volume isn't high-privilege — it's
high-duplication-risk. Phases 192–196 are named almost identically to
products you already built: Translation Runtime (vs. Volume 1's Translation
Engine), Speech Runtime (vs. Volume 2's Speech Cloud), Voice Runtime (vs.
Volume 3), Vision Runtime (vs. Volume 4), Knowledge Runtime (vs. Volume 6).

**The intent is almost certainly that these are thin execution/routing layers
that call into the product logic you already built** — not reimplementations.
I've added that instruction explicitly into phase_00's context block so
Cursor sees it before it starts. Still worth checking as you go: after each
of Phases 01–05, look at whether Cursor actually called into the existing
Volume 1–4/6 services, or wrote new translation/speech/voice/vision logic
from scratch. The second outcome means you now have two different
implementations of the same thing drifting apart over time — a real
maintenance problem, not just inefficiency.

## Run phases in order

| # | Phase | What it builds |
|---|---|---|
| 00 | 191 Data Plane Foundation | Base infra + architecture (see prepended context) |
| 01 | 192 Translation Runtime | Execution layer for Translation (Volume 1) |
| 02 | 193 Speech Runtime | Execution layer for Speech (Volume 2) |
| 03 | 194 Voice Runtime | Execution layer for Voice (Volume 3) |
| 04 | 195 Vision Runtime | Execution layer for Vision/OCR (Volume 4) |
| 05 | 196 Knowledge Runtime | Execution layer for Knowledge (Volume 6) |
| 06 | 197 Embedding Runtime | Execution layer for Embeddings (Volume 5) |
| 07 | 198 Streaming Runtime | Streaming execution (ties to Volume 7's Streaming Runtime) |
| 08 | 199 GPU Runtime | GPU execution (ties to Volume 7's GPU Platform) |
| 09 | 200 Data Plane Production Audit | Hardening pass — review, don't add features, and specifically check for duplication |

**Phase 08 (GPU Runtime)** carries the same real-cost caution as Volume 7's
GPU Platform — verify budget limits before connecting to a real cloud account.

## Same process as before

1. New Cursor Agent conversation per phase.
2. Paste the file content below the `<!-- PASTE... -->` line.
3. Review the diff, actually run it, confirm it works.
4. Commit.
5. Next file.

## After Phase 200

Eighteen volumes, 200 phases — exactly two-thirds of the way through the
master doc's phase count. Ask for Volume 19 (VAIOS Foundation, Phases
201–210) when ready — but a heads-up: this is where the master doc itself
starts shifting from buildable infrastructure toward long-range vision
material (an "AI Operating System" framing). I'll be specific about what's
actually buildable vs. not when you get there, same as I was for Volume 9
and corrected myself on for Volume 10.
