# Lugemi advantage protocol: prove the win before claiming it

Status: mandatory evaluation contract | Extend the existing evaluation and research platforms

## Claim boundary

“Outperform an external speech platform” is too broad to be a useful gate. Test a named task, corridor, variety, domain, device, input distribution, model/version, date and quality/cost operating point. A product can win one corridor and lose another. A missing competing capability is a coverage difference, not an accuracy score of zero.

The supplied libraries are architecture/specification documents. Treat the user-reported build completion as the baseline inventory assumption. Require actual model artifacts, production traces and native-speaker evaluations to establish current performance. Do not reuse the older repository scan's language counts as if they describe this newly reported build.

## Comparison matrix

| Task | Lugemi baseline | External comparison | Rule |
| --- | --- | --- | --- |
| Mixed-language ASR | Existing Echo/gateway recognizer | Eligible external ASR batch/realtime baseline matched to input | Match audio, vocabulary hints, endpoint class and language availability |
| Translation fidelity | Existing Translate and glossary | Eligible MT/translation models plus reviewed interpreter reference | Compare translation tasks; a TTS service is not an MT comparator |
| Voice quality | Existing Voice | Eligible external synthesis baseline matched to language and use | Match script, permitted voices, bitrate, generation settings and target-language support |
| Batch dubbing | Existing Lugemi media pipeline | Eligible external dubbing workflow if target/source supported | Match source media, direction, edit allowances and output task |
| Live interpreted conversation | Existing Lugemi cascade | Matched composed pipeline using eligible ASR + the same MT + appropriate synthesis, and other available streaming baselines | Label a composed workflow; do not imply the composed stack is a single vendor's native interpreter |
| Offline task | Current Edge pack | Commercially eligible on-device baseline | Cloud-only execution is not an equivalent offline test |

Run both component-isolation comparisons and end-to-end comparisons. Holding MT constant isolates ASR/TTS gains; changing all components tests a product workflow but does not identify which model caused the change. Use actual accessible baseline IDs at execution rather than assuming a documentation listing is callable in the account.

## Pilot benchmark design

Freeze two pilot corridors, both task directions where actually supported, reviewed varieties, three practical acoustic conditions, and new speakers. Collect at least 500 independent segments per corridor for the first offline study, clustered across many speakers and sessions. This is an initial planning floor, not a universal sample-size guarantee. Rare critical errors, subgroup estimates and model differences can require substantially more examples.

Maintain four sets: train, development, calibration and a blinded final test. Add a later fresh shadow holdout after model selection. Public benchmarks are secondary checks; a proprietary corpus must still be reproducible to an authorized auditor. Annotators generating final references must not see model identities.

Preregister primary outcome, exclusion criteria, target coverage, confidence level, subgroup slices, stopping rules and a minimally useful effect. Power the study using pilot variance and cluster structure. Do not repeatedly inspect the final holdout while tuning.

## Measurement definitions

- **Critical meaning error:** bilingual adjudication finds changed negation, material quantity/unit, identity, obligation, time, requested action or another preregistered consequential fact. Count rates per independent segment and completed task; report severity categories.
- **ASR:** WER/CER per language span with documented orthographic normalization, entity preservation and switch-boundary quality. Publish raw and normalized results where normalization changes interpretation.
- **Translation:** human adequacy and critical errors are primary. BLEU/chrF and appropriate learned metrics are secondary. Validate learned evaluators on the specific language/domain; do not assume high-resource calibration transfers. Source S6 is relevant evaluation research, not a universal judge for every proposed language.
- **Speech output:** native pronunciation and intelligibility, tonal minimal-pair recognition where appropriate, content fidelity, permitted speaker resemblance and listener preference. MOS alone cannot establish translation fidelity.
- **Streaming:** include input capture, sufficient-context time, queue, inference, verifier, TTS, network and actual playback. Report p50/p95, revision churn, interrupted audio, repairs and completed conversational tasks.
- **Uncertainty:** calibrated predicted event, calibration error/reliability diagrams, selective risk, rejection/clarification rate, and outcome at matched accepted coverage.
- **Economics:** paid provider usage or measured GPU allocation, hosting, retries, validation, human review and support divided by completed successful tasks. Include marginal and fully allocated views separately.

## Experimental fairness

Match inputs, preprocessing, vocabulary hints, geographic testing region and output quality settings. If one vendor allows relevant contextual hints, permit comparable hints or disclose the imbalance. Exclude neither inconvenient speakers nor supported difficult cases without preregistration. Record failures, timeouts and unavailable languages separately.

Use native evaluators with anonymized outputs and randomized order. At least two reviewers for critical meaning labels, with disagreement adjudication. Do not make Lugemi's own LLM the only judge of its superiority. Prevent voice preference from overwhelming correctness in overall scoring.

Bootstrap confidence intervals at speaker/session level rather than treating correlated clips as independent. Use paired comparisons on the same inputs, repeated generation where stochasticity matters, and disclose multiple-comparison correction or exploratory status. Publish subgroup estimates with uncertainty; small samples require “insufficient evidence,” not “no disparity.”

## Release and marketing rule

A model can enter supervised preview when its specified task gate is met, operational/rights checks pass, and known limitations are visible. Broad production release also needs measured concurrency, rollback, cost and failure-recovery evidence. A statistically significant improvement is not sufficient if users lose task coverage or cost doubles beyond their budget.

Proposed superiority claim format: “On [frozen dataset/version], [corridor/task], Lugemi [version] reduced [defined error] by [measured change], versus [actual comparable Lugemi or eligible baseline configuration], at [coverage/latency/cost], tested [date], with [interval].” Publish the denominator and important exclusions. Never translate a narrow win into “best for all African languages” or “better than an external speech platform at everything.”

## Required artifacts and integration tests

Produce dataset/split hash manifest, permissions review, model IDs/configs, scoring code, immutable raw results, adjudication records, confidence calculations, hardware/network profile, cost assumptions and reproducible comparison report. Record secrets outside artifacts; redact identifying examples.

Mandatory integration cases: unsupported language; mixed-language unknown span; ambiguous amount; late negation; silence; disconnect/reconnect; cancellation during playback; tenant-crossing document reference; withdrawn training permission; stale glossary version; corrupted edge pack; cloud-forbidden mode; document prompt injection; unresolvable visual reference. Each must have a concrete expected behavior, not merely “returns 200.”

The first investment decision is based on a real held-out gain versus existing Lugemi. The second is based on a fair external comparison. The third is based on paying design-partner task outcomes. All three are necessary to turn model research into a durable commercial advantage.
