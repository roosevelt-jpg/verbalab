# Starting Lugemi in Cursor — do this in order

This package is pre-cut from the master roadmap so you can hand it to Cursor
Agent one phase at a time. **Do not paste the 16k-line master doc into Cursor
— it'll blow the model's context and produce shallow, generic output.** Each
phase here is already a self-contained, focused prompt, exactly as authored.

Scope covered: **Phase ‑1 → Phase 15**, i.e. Enterprise Product Blueprint
through a fully built, audited **Language/Translation Cloud** — the smallest
real product Lugemi can ship. That's your actual MVP.

## Setup (once)

1. Create a new empty git repo, open it in Cursor.
2. Copy `.cursorrules` from this package into the repo root.
3. Open Cursor Agent (not just inline chat — you want it making multi-file
   changes and running commands).

## Run phases in order

Files are in `/phases`, numbered `phase_00…` through `phase_16…`. For each one:

1. Open the file, copy everything below the `<!-- PASTE... -->` line.
2. Paste it into a **new** Cursor Agent conversation (fresh context per phase
   keeps output focused — don't chain 16 phases into one thread).
3. Let it finish. Read the diff before accepting.
4. Run the tests / start the services it created. Confirm it actually works.
5. `git commit`.
6. Move to the next file.

Order:

| # | Phase | What it builds |
|---|---|---|
| 00 | ‑1 Enterprise Product Blueprint | Architecture docs — context for everything after |
| 01 | 0 Engineering Operating System | Standards docs + the production monorepo itself |
| 02 | 1 Cloud Platform Foundation | Console, orgs, projects, workspaces |
| 03 | 2 Identity Cloud | Auth, permissions |
| 04 | 3 Developer Cloud Foundation | Dev portal, API keys, SDKs |
| 05 | 4 Enterprise Cloud Foundation | Billing accounts, admin |
| 06 | 5 AI Gateway Cloud Foundation | Unified AI request routing |
| 07 | 6 Language Cloud Foundation | Base for all language products |
| 08 | 7 Language Registry | Supported languages/locales data model |
| 09 | 8 Translation Engine | The actual translation product |
| 10 | 9 Localization Platform | Multi-locale content management |
| 11 | 10 Grammar Intelligence | Grammar checking |
| 12 | 11 Style Intelligence | Style/tone checking |
| 13 | 12 Language Intelligence | Combined language analysis |
| 14 | 13 Translation Memory | TM store/reuse |
| 15 | 14 Language Analytics | Usage/quality analytics |
| 16 | 15 Language Cloud Production Audit | Hardening pass — run this as a review, not a build |

## After Phase 15

You'll have a real, working Translation Cloud product with proper foundations
underneath it (identity, billing, dev platform, AI gateway). At that point:

- Ship it / get it in front of users before building anything further.
- If you want to keep expanding by the roadmap, the next volume (Speech Cloud,
  Phases 16–26) is in the master doc — I can cut the same kind of phase pack
  for it whenever you're ready.
- Don't pull from Phase 90+ of the master doc directly into Cursor — that
  territory is vision writing, not implementation-ready specs (see the note in
  the master doc's front matter).
