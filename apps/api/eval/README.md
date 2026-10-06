# Eval goldens & results

Hand-authored EN→sw / EN→yo / EN→am segments for the coverage harness.
Not a licensed FLORES/NLLB dump — expand with licensed corpora and proper licenses.

- `pnpm exec vitest run test/eval-coverage.spec.ts` runs the fixture/oracle harness and refreshes `results/latest.json` when writable.
- Live vendor eval: `EVAL_LIVE=1` + `GOOGLE_TRANSLATE_API_KEY`, then `POST /v1/eval/run?mode=live` (owner/admin).

Public: `GET /v1/coverage` and console-less page `/coverage`.
