# Lugemi Language Kit: evidence-gated onboarding for underserved languages

Priority: third | Family: Baobab + Echo + Translate; data acquisition policy

## Exact addition

Existing registries and African foundation models already cover expansion in principle. Add a repeatable experimental procedure that turns approved community data into a narrowly released task capability, quantifies how much new data improves it, and rejects unjustified “supported” status.

Pilot one additional Ghanaian language, such as Ewe, only when appropriate partners, orthographic review and commercial data rights are available. This is not a claim that Ewe lacks support elsewhere. Start with batch transcription and one translation direction; add TTS only with separate voice data and permission.

## Architecture

A language pack contains valid tags, reviewed variety metadata, script/frontend configuration, normalization rules, pronunciation resources, approved terminology, adapters, model versions, calibration artifacts, task-specific coverage and evaluation reports. Keep dataset metadata, acoustic variety and UI locale separate.

Compare multilingual transfer with language-specific adapters and a compact task model. Test vocabulary fragmentation before changing tokenization. Tokenizer extension can alter pretrained behavior: measure it against unchanged-tokenizer baselines and include replay tests for existing languages. Linguistic relatedness is a hypothesis, not proof of interchangeable data.

## Acquisition and training

Plan a seed of 20 hours of native recorded speech, 5,000 reviewed sentence pairs and a small held-out collection from new speakers and domains. These support feasibility experiments, not automatic public release. Publish learning curves at multiple data increments; increase data when improvement remains material.

Use active acquisition based on estimated uncertainty, representativeness, critical-error categories and annotator cost. Compare its selected batches with a random-acquisition control. Uncertainty alone can overselect corrupt or adversarial audio. Require language-lead approval for collection prompts, orthography and translations. Retain alternative acceptable spellings and unresolved cases.

Train task adapters and lexicon-constrained baselines. Use consented high-resource transfer and synthetic augmentation only after inspecting distribution shift. Do not recursively treat generated translations as gold. Hold out contributors, sources and template families across evaluation splits.

## Proposed pack workflow

`POST /v1/language-kits` creates a draft task/variety profile. Versioned stages: `draft`, `data_ready`, `trained`, `evaluated`, `preview`, `released`, `withdrawn`. A registry entry is not a model release. `GET /v1/language-kits/{id}/coverage` returns separate statuses for ASR, translation directions and synthesis, with evaluated domains and device limitations.

Training runs reference an immutable dataset manifest and an approved license/consent policy. Changes to writing conventions or task scope create a new version. Native leads can request correction, restricted access or withdrawal; previously distributed weights require a tracked remediation process, not a promise of instant erasure.

## Evaluation and promotion

Measure data efficiency as accepted quality gain per paid annotation hour, and include rejected/ambiguous examples. Compare fixed-data and fixed-budget baselines. Use native translation review, WER/CER with disclosed normalization and critical entity tests. Novel speakers and conversational audio matter more than training-set demonstrations.

Proposed experiment goal: achieve the same held-out task quality with 25% less annotation spend than random acquisition, with repeated sampling seeds and uncertainty estimates. Public task release additionally requires the existing platform's fidelity, rights, security and reliability gates; sparse data alone cannot prove readiness.

Stop expansion if credible reviewers are unavailable, licensing blocks commercialization, or related-language transfer harms existing models. Sources S6 and S8 inform African-language evaluation and community partnership. They do not provide permission to reuse any specific dataset.
