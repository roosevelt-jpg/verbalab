# Lugemi Fidelity: translation verification and clarification

Priority: first | Working family: Translate + Reason, with Trust integration

## Exact addition and customer value

V2 already includes translation confidence, quality assessment, explainability and safety. Add a task-specific, trained verifier that identifies changed meaning and asks a targeted clarification instead of silently delivering a fluent but wrong translation. This is not a guarantee of correctness or certified interpretation.

Pilot customer-service example: “I did not approve the transfer of 500” must not become an approval of 5,000. The system flags altered negation or quantity before the result is spoken or used by an agent. Domain facts inferred from general knowledge must not override what the caller actually said.

## Model and pipeline

Construct an internal **meaning ledger**: source evidence spans, speaker, entity identity, quantity/unit, polarity, temporal relation, modality, requested action and uncertainty. It is a versioned representation for checking obligations, not a universal proof of semantics.

1. Extract ledger candidates from source text and, where permitted, competing speech hypotheses.
2. Generate translation using the existing engine and glossary.
3. Align ledger candidates to target spans.
4. Apply deterministic checks for amounts, dates, identifiers and explicit glossary constraints.
5. Run a cross-lingual error detector for omission, addition, wrong relation, negation and inconsistent entities.
6. Calibrate error probability on separate human labels; choose accept, retry, clarify or review according to a versioned cost policy.

Compare a compact cross-encoder against an adapted multilingual LLM. An independent model or independently trained head is preferable to asking the generator whether its own output is correct. Back-translation and model agreement can supply features, but neither proves fidelity. Return short evidence-backed reason codes, not hidden reasoning traces.

## Training data

Begin with 10,000 reviewed source/translation pairs per pilot corridor, including valid alternatives and 2,000 deliberately constructed critical-error cases per corridor. These are starting acquisition targets. Separate natural production-like errors from synthetic corruptions in evaluation. Label error spans, category, severity and ambiguity; record reviewer disagreement.

Create minimal contrasts for negation, tens/thousands, before/after, subject/object, conditional promises, names, and currency/unit distinctions. Split by source document, speaker and customer. Keep calibration and final tests separate. Minimize template leakage and include translations that are paraphrases but still valid.

Train span/error classification or task-specific instruction adaptation, then fit calibration on untouched development data. Audit reliability by language, channel and domain. Out-of-domain or unsupported inputs must not receive a familiar-looking confidence percentage.

## Proposed contract

`POST /v1/fidelity/verify`: source/target text, optional authorized audio span, language metadata, domain policy and glossary version. Return `decision`, `error_probability` or null, `error_event_definition`, `calibration_version`, error spans, ledger references and proposed clarification. `POST /v1/fidelity/clarify` associates a caller's answer with the unresolved span; it must not turn refusal or silence into confirmation.

Ledger data is tenant-scoped, encrypted, retained under policy and excluded from training unless separately authorized. Text inside documents or speech is untrusted content and cannot change verifier policies.

## Release gate

Publish risk-versus-coverage curves: rejection of everything is not a successful model. Define accepted critical-error rate as erroneous accepted segments divided by all accepted segments; define detection recall on labeled critical errors separately.

Proposed supervised pilot goal: at least 90% critical-error detection recall while accepting at least 80% of in-scope, production-like segments, with calibration reported. For an accepted-critical-error upper bound below 1%, use an exact binomial confidence bound and an adequately sized independently reviewed accepted set; approximately 300 independent zero-error observations only give a rough 95% upper bound near 1%. Clustered calls require cluster-aware analysis and more data. No gate permits autonomous clinical/legal action.

Stop if humans cannot reliably define the labels, if rejection burden destroys task value, or if a generator-plus-rules baseline performs equally well. Measure saved corrections and completed tasks in the supervised pilot. Source S6 motivates region-appropriate translation evaluation; thresholds here are Lugemi proposals.
