# Lugemi: the next model portfolio

Version 1.0 | 6 October 2026 | Research and engineering proposals

## Recommendation

Build a language system that preserves what people mean, knows when it is uncertain, and repairs communication before an error becomes an action. Start with deeply evaluated African-language corridors, then transfer the methods to other markets. A larger generic LLM or another platform layer is not the strongest next investment.

The three priority bets are **Mix** (mixed-language speech), **Fidelity** (meaning verification and clarification), and **Live** (incremental interpretation with explicit commitment and repair). Combine them into one initial customer offering: **Lugemi Verified Interpreter**. This is a proposed working name, not a cleared brand or a released service.

These ideas could differentiate Lugemi on selected tasks. They are not evidence that it already outperforms an external speech platform, or inventions claimed to be unique in the literature. Win a defined evaluation and customer workflow before making a superiority claim.

## What the supplied libraries already cover

Reviewed inputs: `LUGEMI AI ENGINEERING LIBRARY V1.md` and `LUGEMI ENGINEERING LIBRARY v2.md`. The second file contains later version-labelled sections as well as its v2 heading; use its actual contents rather than assuming a clean version boundary. The user reports everything has been built. This pack accepts that as the planning assumption; these attached prompt/specification libraries do not themselves verify deployed weights, training runs, production quality, or adoption.

| Existing scope | Source anchors | What to add rather than rebuild |
| --- | --- | --- |
| Translation, quality, terminology, memory | V1 phases 5, 17, 42; V2 phases 8, 12, 13, 101 | Span-level meaning verification, calibrated rejection, and corrective dialogue |
| ASR, accents, pronunciation, neural voice | V2 phases 17, 19, 22, 28, 94, 95 | Joint recognition/translation of switch boundaries, tonal minimal pairs and protected names |
| Live interpreter and streaming | V1 phase 9; V2 phases 75, 198, 256 | A learned policy for when translated meaning becomes safe to speak, plus audible repair |
| Culture, styles and regional intelligence | V2 phases 11, 129 and the Global Intelligence recommendation | Explicit speech-act and register preservation, without silently changing literal meaning |
| Baobab and language registries | V1 phase 43; V2 phases 93, 128 | An evidence-gated language onboarding procedure with acquisition curves |
| Edge, private deployment, sovereignty | V2 phase 99 and Sovereign Deployment recommendation | Tested pair-specific offline bundles with quality manifests and controlled fallback |
| Multimodal models, OCR, embeddings, knowledge | V2 phases 43, 48, 65, 100 | Joint translation of speech and a user-selected visual referent, with contradiction detection |
| Datasets, learning and benchmarks | V2 phases 140, 141, 149, 151, 156 | Rights-aware error acquisition and blind corridor-specific competitive evaluation |

## Positioning

External speech and translation platforms already offer multilingual synthesis, recognition, and real-time models. Do not pitch generic code-switching, cloning, emotional dubbing, or low latency alone as a new category. Lugemi's opportunity is measurable local depth and a coherent verified communication workflow.

## Portfolio and build order

| Order | Brief | Model class | Potential customer value |
| --- | --- | --- | --- |
| 1 | 01_MIX | Adapted speech encoder/decoder and constrained translation | Correctly understand real mixed-language speech |
| 1 | 02_FIDELITY | Cross-lingual error detector, calibrator and clarification policy | Catch missing negations, quantities, names and commitments |
| 2 | 03_LIVE | Streaming translation and learned read/write/commit policy | Interpret naturally without silently rewriting spoken output |
| 3 | 04_PRAGMATICS | Task-trained multilingual language model or adapter | Preserve politeness, urgency and conversational intent |
| 3 | 05_LANGUAGE_KIT | Language adapters and data acquisition policy | Expand quality in underserved languages reproducibly |
| 4 | 06_EDGE | Distilled and quantized corridor-specific model bundle | Work reliably on constrained devices without cloud access |
| 4 | 07_GROUNDED | Multimodal adapter, retrieval and referent verifier | Translate what the user is actually pointing to |
| Enabler | 08_DATA | Data and contributor workflow | Acquire defensible training evidence, not just more volume |
| Enabler | 09_BENCHMARKS | Evaluation protocol | Prove or disprove the proposed advantage |

## Initial customer wedge

Pilot bilingual customer-service calls for Ghanaian and Nigerian businesses: Twi-English and Yoruba-English first, with Hausa-English as an additional corridor if partners and baseline results justify it. FLYN AI can be a consenting design partner; do not automatically reuse its customer conversations. Language directions, varieties, scripts and model coverage must be recorded separately. Twi is not a proxy for all Akan varieties; Hausa, Yoruba and Nigerian Pidgin are different language choices.

Use the same method later for Spanish-English, Brazilian Portuguese-English, Indonesian-English, reviewed Caribbean creole corridors, Ukrainian-English, Russian-English, Hindi-English and Urdu-English. This is a proposed evaluation expansion list, not promised model support. Pick actual communities and written varieties before acquiring data.

The first demonstrable result should be fewer consequential communication errors per completed customer task at an acceptable latency and cost. Broad healthcare, legal or emergency deployment is outside the initial pilot.

## Shared technical contract

Extend the existing Language, Speech, Voice, Inference, Trust, Knowledge and MLOps services. Do not create a second kernel, model registry, billing system or cloud hierarchy. Map proposed logical APIs to the real repository before implementation; paths in this pack are proposed contracts, not existing endpoints.

Every result needs `request_id`, `model_id`, `model_version`, `language_pack_version`, `source_language_tags`, `target_language_tag`, `variety_id`, `status`, `warnings`, and an evidence reference. Distinguish `supported`, `preview`, `unsupported`, and `unavailable`. Unknown variety is valid. Do not invent confidence scores. A calibrated probability must state which event it predicts, its calibration version, and the evaluated population.

Model releases need weights/adapters, tokenizer or frontend, model card, data lineage manifest, license review, calibration artifact, held-out report, hardware/runtime measurements, training recipe and seed, reproducible inference image, rollback procedure and versioned API schema. Persist authorized decision metadata, not hidden chain-of-thought or full sensitive recordings by default.

## Training strategy and investment gates

1. Freeze representative held-out data and measure the existing Lugemi pipeline.
2. Establish commercially eligible baselines; inspect exact model, weight, dataset and derivative-use terms. Public weights and research code are not automatically commercially usable.
3. Try constrained decoding, terminology retrieval, small classifiers, adapters and distillation before pretraining a new foundation model.
4. Train only where ablations show prompting and orchestration plateau.
5. Promote models only when they beat their baseline on a predeclared primary task without unacceptable subgroup regressions.

Initial resourcing assumption: one speech researcher, one translation/ML researcher, one ML/platform engineer, one product/backend engineer, and paid language leads/annotators for each corridor. This is a proposed staffing mix, not an estimate that the existing team can deliver every model simultaneously.

First six weeks are a discovery and pilot cycle: two weeks for rights, existing-artifact inventory and benchmark; two for baseline/adaptation; two for offline comparison and a supervised workflow demo. This is not a promise of production foundation models in six weeks. Live, edge and multimodal work follows evidence and separate estimates.

Do not buy a large GPU fleet until measured experiments justify it. Estimate training cost as accelerator-hours times effective hourly price, plus storage, annotation, evaluation and engineering. Estimate serving cost per completed successful task, including verifier passes, retries, clarification and human review. Obtain current vendor quotes before budget approval.

## Continue, stop or narrow

Continue a bet when native-speaker evaluation improves, deployment cost fits the customer workflow, and a design partner would pay for the difference. Stop or narrow it when gains disappear on new speakers, when most inputs require rejection, when quality gains cannot justify additional latency, or when rights prohibit commercial use. No target in the individual briefs is an achieved result; numeric thresholds are proposed pilot gates requiring baseline and sample-size review.

## Sources and evidence boundary

Sources checked 6 October 2026. Store API-accessible model IDs and documentation snapshots when running comparisons; documentation can change. Vendor documentation deexternal baselines vendor capabilities, not independent performance proof. These references inform direction; each dataset and checkpoint requires separate license review.

- **S6:** Wang et al., AfriMTE and AfriCOMET, NAACL 2024: https://aclanthology.org/2024.naacl-long.334/
- **S7:** Uemura et al., AfriMTEB and AfriE5, EACL 2026: https://aclanthology.org/2026.eacl-long.171/
- **S8:** Masakhane research community: https://www.masakhane.io/

## Engineering-agent instruction

Read this file and the selected brief plus 08_DATA and 09_BENCHMARKS. Inspect existing repository instructions and integration points. Produce a bounded implementation plan and artifact inventory. Reuse existing services and contracts. Implement one pilot corridor, train or adapt the necessary real model, and supply benchmark results. Do not generate placeholder accuracy, fake confidence, mock production providers, invented language tags or all-language support. Do not deploy or publish as part of this document request.
