# Lugemi — Volume 14: MLOps & LLMOps Cloud (Phases 148–158)

Same workflow as Volumes 1–13. `.cursorrules` at the repo root still applies.
This volume builds the operations layer over Volumes 7–9 (Inference, AI
Kernel, Foundation Models) and Volume 6 (RAG from Knowledge Cloud). Remind
Cursor in your first message that those exist.

## Run phases in order

| # | Phase | What it builds |
|---|---|---|
| 00 | 148 MLOps & LLMOps Foundation | Base infra + architecture (see prepended context) |
| 01 | 149 Dataset Pipeline | Dataset versioning/pipeline management |
| 02 | 150 Training Pipeline | Training orchestration |
| 03 | 151 Continuous Evaluation | Ongoing eval against production traffic |
| 04 | 152 PromptOps Platform | Prompt versioning/lifecycle |
| 05 | 153 RAGOps Platform | RAG pipeline ops (ties to Volume 6's RAG Platform) |
| 06 | 154 AgentOps Platform | Agent monitoring (ties to Volume 8's Agent Runtime) |
| 07 | 155 AI Drift Detection | Model/data drift monitoring |
| 08 | 156 Continuous Learning | Auto-retraining from production data |
| 09 | 157 AI Operations Dashboard | Unified ops view |
| 10 | 158 MLOps Production Audit | Hardening pass — review, don't add features |

## One thing worth actually checking on this volume

**Phase 08 (Continuous Learning)** auto-retrains models on production data —
this is the one phase in this volume that can actually change system behavior
on its own, unsupervised. Before trusting it:
- Confirm there's a human-approval gate before a retrained model actually
  replaces the live one (not fully automatic promote-to-production)
- Check it can't retrain on unvetted/poisoned input (someone deliberately
  feeding bad data to shift model behavior over time) — this is a known
  attack pattern against continuous-learning systems
- Confirm Phase 07 (Drift Detection) and Phase 03 (Continuous Evaluation)
  are actually wired in as a check *before* Continuous Learning promotes
  anything, not running in parallel with no relationship to it

**Phase 06 (AgentOps)** should be the monitoring layer that makes Volume 8's
Policy Runtime concerns visible — check it actually surfaces policy
violations/blocked actions somewhere a human will see them, not just logs
no one reads.

## Same process as before

1. New Cursor Agent conversation per phase.
2. Paste the file content below the `<!-- PASTE... -->` line.
3. Review the diff, actually run it, confirm it works.
4. Commit.
5. Next file.

## After Phase 158

Fourteen volumes, 158 phases. Ask for Volume 15 (Trust Cloud, Phases
159–168) when ready.
