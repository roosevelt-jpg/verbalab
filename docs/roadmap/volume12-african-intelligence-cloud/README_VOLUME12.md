# VerbaLab — Volume 12: African Intelligence Cloud (Phases 127–137)

Same workflow as Volumes 1–11. `.cursorrules` at the repo root still applies.
This volume builds on the Language/Knowledge/Intelligence clouds from
Volumes 1, 5, and 6. Remind Cursor in your first message that those already
exist.

## Run phases in order

| # | Phase | What it builds |
|---|---|---|
| 00 | 127 African Intelligence Cloud Foundation | Base infra + architecture (see prepended context) |
| 01 | 128 African Language Registry | Language/dialect/accent data model |
| 02 | 129 Cultural Intelligence Platform | Proverbs, idioms, names, culture |
| 03 | 130 African Knowledge Graph | Entity/relationship graph for the above |
| 04 | 131 Government Intelligence | Government-domain content/services |
| 05 | 132 Healthcare Intelligence | Healthcare-domain content/services |
| 06 | 133 Financial Intelligence | Banking/finance-domain content/services |
| 07 | 134 Education Intelligence | Education-domain content/services |
| 08 | 135 Agricultural Intelligence | Agriculture-domain content/services |
| 09 | 136 Tourism & Heritage Intelligence | Tourism/heritage-domain content/services |
| 10 | 137 African Intelligence Production Audit | Hardening pass — review, don't add features |

## This volume has two distinct categories of real risk — worth reading, not skimming

**1. Cultural/traditional knowledge needs consent and attribution, not just
data modeling.** Phase 02 (Cultural Intelligence) and Phase 00's "Traditional
Knowledge" category deal with content that belongs to specific communities —
proverbs, oral history, traditional practices. Treat this differently from,
say, scraping public web text: check whether the data model Cursor builds
has fields for provenance/source community and a consent/licensing status,
not just raw content storage. Ingesting traditional knowledge without
attribution or consent is an extractive pattern worth actively designing
against, not an edge case to patch later.

**2. Phases 04–06 (Government, Healthcare, Financial Intelligence) are
exactly the domains where confidently wrong AI output causes real harm.**
Before any of this serves real users:
- **Healthcare (Phase 05):** if this platform will ever answer health
  questions, make sure output is framed as information, not diagnosis, with
  a clear "consult a professional" posture built into the product behavior
  itself — not just a disclaimer buried in ToS. Confirm there's no path
  where it looks like personalized medical advice.
- **Financial (Phase 06):** same pattern for anything resembling investment,
  lending, or credit decisions — check for fair-lending/non-discrimination
  considerations if this touches real credit/lending data later.
- **Government (Phase 04):** if this surfaces official government
  information (benefits eligibility, legal processes), verify there's a
  mechanism to keep it current and sourced — stale or wrong government
  guidance is a specific, serious failure mode, not just "content could be
  better."

None of this blocks building the infrastructure now — it's a reason to check
what guardrails Cursor actually put in place versus what it left as a content
model with no behavioral guardrails around it.

## Same process as before

1. New Cursor Agent conversation per phase.
2. Paste the file content below the `<!-- PASTE... -->` line.
3. Review the diff, actually run it, confirm it works.
4. Commit.
5. Next file.

## After Phase 137

Twelve volumes, 137 phases. Ask for Volume 13 (Research Cloud, Phases
138–147) when ready.
