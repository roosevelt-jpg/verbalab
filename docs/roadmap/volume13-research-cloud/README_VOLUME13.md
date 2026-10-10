# Lugemi — Volume 13: Research Cloud (Phases 138–147)

Same workflow as Volumes 1–12. `.cursorrules` at the repo root still applies.
This volume builds on the Intelligence/Knowledge/Foundation Model clouds
(Volumes 5, 6, 9). Remind Cursor in your first message that those exist.

## Run phases in order

| # | Phase | What it builds |
|---|---|---|
| 00 | 138 Research Cloud Foundation | Base infra + architecture (see prepended context) |
| 01 | 139 Experiment Platform | Experiment tracking/management |
| 02 | 140 Synthetic Data Platform | Synthetic dataset generation |
| 03 | 141 Benchmark Platform | Benchmark suites/leaderboards |
| 04 | 142 Evaluation Platform | Model/system evaluation |
| 05 | 143 AI Publication Platform | Research paper authoring/tracking |
| 06 | 144 Patent & Innovation Platform | IP tracking |
| 07 | 145 Open Science Platform | Open-source/dataset release tooling |
| 08 | 146 Research Analytics | Usage/output analytics |
| 09 | 147 Research Cloud Production Audit | Hardening pass — review, don't add features |

## Lower-risk volume, lighter notes

This is mostly internal tooling — no payments, no end-user PII, no
autonomous agent actions. Two things still worth a glance:

- **Phase 02 (Synthetic Data Platform):** if synthetic data generated here
  ever gets used to train/evaluate models that touch the sensitive domains
  from Volume 12 (healthcare, financial, government), make sure it's
  labeled as synthetic downstream — synthetic data silently treated as real
  training signal is a known failure mode worth guarding against from the
  start.
- **Phase 07 (Open Science Platform):** if this actually publishes datasets
  or code externally, check it respects the same consent/provenance fields
  you confirmed Volume 12 built (`provenance`, `sourceCommunity`,
  `consentStatus`) before anything carrying `traditionalKnowledgeConsentRequired=true`
  can be included in an open release.

## Same process as before

1. New Cursor Agent conversation per phase.
2. Paste the file content below the `<!-- PASTE... -->` line.
3. Review the diff, actually run it, confirm it works.
4. Commit.
5. Next file.

## After Phase 147

Thirteen volumes, 147 phases. Ask for Volume 14 (MLOps/Platform, Phases
148–158) when ready.
