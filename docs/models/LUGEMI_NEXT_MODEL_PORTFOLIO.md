# Lugemi next model portfolio: complete engineering pack

6 October 2026 | Ten briefs in recommended reading order.

# Lugemi: the next model portfolio

Version 1.0 | 6 October 2026 | Research and engineering proposals

## Recommendation

Build a language system that preserves what people mean, knows when it is uncertain, and repairs communication before an error becomes an action. Start with deeply evaluated African-language corridors, then transfer the methods to other markets. A larger generic LLM or another platform layer is not the strongest next investment.

The three priority bets are **Mix** (mixed-language speech), **Fidelity** (meaning verification and clarification), and **Live** (incremental interpretation with explicit commitment and repair). Combine them into one initial customer offering: **Lugemi Verified Interpreter**. This is a proposed working name, not a cleared brand or a released service.

These ideas could differentiate Lugemi on selected tasks. They are not evidence that it already outperforms ElevenLabs, or inventions claimed to be unique in the literature. Win a defined evaluation and customer workflow before making a superiority claim.

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

## Competitive reality

ElevenLabs' current model documentation lists multilingual synthesis, speech recognition and real-time models [S1]. Its transcription documentation includes keyterm prompting, entities and multilingual recognition [S2]; its April 2026 update discusses Indic-English switching [S3]. Its dubbing API supports project-based translation [S4]. These establish substantial existing competition. Do not pitch generic code-switching, cloning, emotional dubbing, or low latency alone as a new category.

Meta's Seamless research is also a baseline for expressive and streaming translation [S5]. Lugemi's opportunity is measurable local depth and a coherent verified communication workflow, not claiming competitors have never addressed these problems.

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

Sources checked 6 October 2026. Store API-accessible model IDs and documentation snapshots when running comparisons; documentation can change. Vendor documentation describes vendor capabilities, not independent performance proof. These references inform direction; each dataset and checkpoint requires separate license review.

- **S1:** ElevenLabs model documentation: https://elevenlabs.io/docs/overview/models
- **S2:** ElevenLabs transcription documentation: https://elevenlabs.io/docs/overview/capabilities/speech-to-text
- **S3:** ElevenLabs, Scribe v2 update, 2 April 2026: https://elevenlabs.io/blog/scribe-v2-just-got-an-upgrade
- **S4:** ElevenLabs dubbing project API: https://elevenlabs.io/docs/api-reference/dubbing/create-project
- **S5:** Meta Seamless Communication research: https://ai.meta.com/research/seamless-communication/
- **S6:** Wang et al., AfriMTE and AfriCOMET, NAACL 2024: https://aclanthology.org/2024.naacl-long.334/
- **S7:** Uemura et al., AfriMTEB and AfriE5, EACL 2026: https://aclanthology.org/2026.eacl-long.171/
- **S8:** Masakhane research community: https://www.masakhane.io/

## Engineering-agent instruction

Read this file and the selected brief plus 08_DATA and 09_BENCHMARKS. Inspect existing repository instructions and integration points. Produce a bounded implementation plan and artifact inventory. Reuse existing services and contracts. Implement one pilot corridor, train or adapt the necessary real model, and supply benchmark results. Do not generate placeholder accuracy, fake confidence, mock production providers, invented language tags or all-language support. Do not deploy or publish as part of this document request.


---

# Lugemi Mix: meaning-preserving mixed-language speech

Priority: first | Working model family: Echo + Baobab + Translate + Voice

## Exact addition

Existing code-switching, ASR and dialect detection are already in V1 phase 42 and V2 phases 17 and 93. The delta is one trained system that preserves language-switch spans, local names, lexical tone where meaning depends on it, and translation alignment across speech input and output. Plain language identification followed by one monolingual recognizer is insufficient for this hypothesis.

Example acceptance scenario: a Twi-English caller switches language while giving a name, payment amount and correction. Output must preserve the name and corrected amount, show the original mixed transcript, and translate the meaning into English. Collect an authentic, native-reviewed example; do not invent a Twi sentence or apply Ghanaian labels to generic English data.

## First scope and architecture

Train for Twi-English and Yoruba-English separately, with regional metadata and both switch directions. Use existing streaming acoustic frontend, diarization and serving. Preserve competing ASR hypotheses when ambiguity affects a protected entity.

Compare three architectures: existing multilingual ASR plus translation; speech encoder adapted with joint transcription and language-span heads; and that adapted encoder plus cross-lingual translation decoder. Promote joint speech translation only if it improves over the inspectable cascade. Preserve intermediate evidence even when direct translation wins.

Attach a phoneme/tone-aware frontend and pronunciation lexicon to existing TTS. Separate lexical tone from expressive prosody. A decoder may choose among legitimate orthographic alternatives; it must not fabricate tone marks when the audio is ambiguous. Cloned target-language speech requires separately established permission.

## Data and learning

Start acquisition planning with 100 hours of consented, diverse mixed-language training audio across the two corridors and 20 hours of separately collected development/test audio, split by speaker and session. These are budgeting seeds, not adequate-data guarantees. Expand based on learning curves.

Labels: verbatim text, reviewed orthographic text, timestamps, span language or `unknown`, switch boundaries, names/numbers, speaker corrections, noise condition and translation alternatives. Capture intra-word borrowing separately from genuine switches. Have two reviewers resolve consequential ambiguities. Add native-designed tonal minimal pairs for Yoruba, including natural connected-speech realizations.

Train supervised ASR/adapters, boundary tagging, and translation alignment with balanced corridor sampling. Hard negatives should include wrong names, omitted negation and switch smoothing. Loss weights are tuned experimentally, not fixed in this brief. Test full model, each adapter and lexicon-only baselines. Synthetic switches are augmentation, never the primary quality evidence.

## Proposed API and UI

`POST /v1/mix/transcribe-translate`: signed audio reference, target language, authorized glossary and requested variety. Return spans, original transcript, translated segments, entity alignment, uncertainty reasons and versioned model metadata. Use input language hints as hints, not hard forced labels. Streaming events reuse Live's segment identifiers.

UI shows original and translated text side by side, highlights uncertain spans, permits correction, and keeps names stable. It should say which varieties were evaluated rather than claiming every dialect.

## Experiment and release gates

Report WER/CER by language span, switch-boundary F1, protected-entity exact accuracy, critical meaning errors and native-speaker pronunciation judgments. Compare on new speakers and channels. Report ambiguity and rejection rates, not just accepted outputs.

Proposed pilot goal: at least 15% relative reduction in consequential meaning errors versus current Lugemi at matched task coverage, with a paired confidence interval excluding no improvement. Limit critical entity accuracy regression to two percentage points in any preregistered subgroup; widen data before promotion if uncertainty is too high. Competitor comparison requires matched supported corridors and the protocol in 09.

Kill or narrow the joint model if an inexpensive cascade matches it. Deliver a corridor-specific adapter and data advantage rather than an unnecessary large LLM. Main dependencies are bilingual reviewers, genuine mixed-language recordings, language-specific tokenization and commercial training rights. Sources: S2, S3 and S6 in 00_START_HERE; they establish competition and evaluation considerations, not Mix's results.


---

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


---

# Lugemi Live: incremental interpretation with commitment and repair

Priority: second | Family: Echo + Translate + Voice; learned streaming policy

## Exact addition

Live interpretation and streaming already exist in the supplied scope. Add a language-pair-specific policy deciding when to wait, show provisional text, commit text and speak it. The differentiator is a quality/latency operating curve plus transparent repair of already spoken mistakes, not an unsupported sub-500ms end-to-end promise.

Example: a speaker starts “Send five...” then corrects to “fifty, tomorrow, not today.” The output cannot silently revise audio the listener already heard. It must pause when necessary and issue an explicit correction if commitment happened too early.

## Architecture

Use causal audio chunks and bounded history. Keep VAD boundaries distinct from semantic completion. Existing ASR emits partial hypotheses with monotonically increasing revisions; translation generates provisional segments. A learned read/write policy estimates sufficient context. A separate commit policy uses entity stability, polarity, reordering risk and Fidelity's decision.

States: `receiving -> provisional -> committed -> spoken`; `repair_required` is reachable after commitment, and `cancelled` before playback. Once audio is played it is immutable. A repair references the earlier segment and creates new audible content. Stop buffered playback on interruption; preserve what has already been heard. Guarantee exactly-once commitment within a session using event IDs and acknowledgements, not exactly-once network delivery.

Start with an inspectable streaming cascade. Research direct speech-to-speech only as a later controlled comparison. Source S5 establishes that expressive streaming translation already has substantial prior work; novelty and superiority need evidence.

## Data and training

Collect paired timed conversations with false starts, self-corrections, late negations, overlap, names and language switching. Translators annotate multiple valid commit points, target paraphrases and repair utterances. Start with 500 reviewed conversations per corridor; expand after policy learning curves. Split by speaker/session and retain full timing.

First tune heuristic wait policies and compare wait-k baselines. Then learn read/write and commit decisions from annotated trajectories or simulated replay. Optimize a weighted objective for fidelity, delay, unnecessary pauses and repair burden. Do not reward a policy merely for predicting future words. Offline policy gains must survive causal streaming tests without lookahead. Reinforcement learning is optional after supervised imitation works.

## Proposed protocol

`POST /v1/live/sessions` negotiates PCM sample rate, channel count, languages, glossary and permissions. A WebSocket carries audio and versioned events:

```json
{
  "event_id": "evt_0042",
  "session_id": "session_example",
  "segment_id": "seg_17",
  "revision": 3,
  "type": "translation.committed",
  "source_start_ms": 4200,
  "source_end_ms": 6100,
  "replaces_segment_id": null,
  "evidence_ref": "ledger_example",
  "model_version": "pilot-1"
}
```

Authenticate session ownership, bound buffers, rate-limit streams, reject out-of-order source sequence gaps, support reconnect acknowledgements and expose backpressure. Disconnect may resume only unplayed buffered content; never replay all prior speech automatically. Caption revision styling distinguishes provisional and committed text.

## Evaluate and promote

Report p50/p95 delay from a labeled sufficient-context point to first target audio actually played. Also report onset-to-first-audio, final-segment lag and session startup. Include network, queue, ASR, translation, verification, TTS and playback separately. Provider inference milliseconds are not end-to-end interpretation latency.

Measure critical meaning errors at matched delay, delay at matched quality, revision churn, interruptions, audible repairs and listener task success. Record packet loss, device, region and concurrency. Proposed pilot gate: 20% lower p95 sufficient-context delay at no worse critical-error rate than current Lugemi, with cluster-aware intervals. Slower commitment is acceptable for unstable critical entities. Stop if quicker speech simply raises downstream repair costs.


---

# Lugemi Pragmatics: preserve intent, register and interpersonal meaning

Priority: third | Family: Baobab + Translate + Voice

## Exact addition

Culture and style engines already exist. Add supervised preservation of speech acts across languages: a request stays a request, an uncertain statement stays uncertain, a warning stays a warning, and a conditional commitment stays conditional. Keep this distinct from making a translation sound more persuasive.

Customer scenario: a polite indirect request is translated as a firm demand, changing a support conversation. The model offers a faithful natural rendering and, where needed, explains that no exact equivalent exists. The user can select literal translation or clearly labelled localization; the system never quietly mixes them.

## Inputs and architecture

Inputs are source content, conversation context authorized for the task, target locale, approved terminology and optional explicit register preference. Outputs are translation candidates, source speech-act labels, evidence-backed preservation checks, and optional adaptation notes.

Start with task-trained classification plus translation reranking. Adapt an existing multilingual language model only if classifiers/rules cannot handle the evaluated cases. Feed explicit speech-act and register constraints into the translation decoder and target voice style frontend. Do not infer personality, ethnicity, sincerity or emotional truth from voice. “Culture” must come from reviewed linguistic context or explicit user choice, not nationality stereotypes.

## Dataset and training

Acquire an initial 5,000 native-reviewed utterance/context pairs per corridor across customer service, everyday conversation and professional communication. Include literal versions, natural equivalent alternatives, intentionally incorrect register changes, ambiguity labels and cases where preserving an indirect expression is inappropriate without explanation. This is a discovery target, not a guaranteed minimum.

Have source and target reviewers assess propositional meaning, obligation strength, politeness, urgency and speaker stance independently. Preserve disagreement and regional variety metadata. Exclude demographic guesses. Do not use a single reviewer to define an entire region.

Train a speech-act classifier, an adapted translation/reranking model and a violation verifier. Use preference pairs with bilingual human labels for naturalness and intent preservation. DPO or another preference objective is optional; compare against supervised fine-tuning. Constraints on numbers, negation and named entities from Fidelity take priority over stylistic preferences.

## Proposed API and product behavior

`POST /v1/pragmatics/translate` takes `mode: faithful | literal | localized`, explicit locale and optional user-selected register. Return mode, candidates, preserved-act checks, uncertainty and disclosed changes. Default is faithful translation. Do not permit style prompts to silently transform a refusal into consent or an estimate into a promise.

Voice rendering consumes validated style controls while preserving lexical tone and meaning. It must not claim it has identified a person's internal emotions. A caller can choose plain-language clarification instead of cultural adaptation.

## Evaluation and release

Use blinded native-speaker pairwise preferences and annotated act-preservation tests. Naturalness and speaker similarity are secondary to fidelity. Report scores separately by locale, register, direction and reviewer disagreement. Include global corridor transfer without treating one Spanish, Arabic or Hindi variety as universal.

Proposed pilot gate: at least 20% relative reduction in human-labelled speech-act violations versus the current style/translation pipeline, without a statistically supported increase in critical propositional errors. Require a separate native-speaker review of target audio; a style tag alone is not evidence of successful prosody.

Stop or narrow when labels are inconsistent, the feature stereotypes users, or its benefit disappears without large context access. Sources S4 and S5 establish existing expressive translation; this brief proposes explicit intent-preservation controls rather than declaring expression preservation new.


---

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


---

# Lugemi Edge Packs: verified offline speech translation

Priority: fourth | Family: Edge + Echo + Translate + Voice

## Exact addition

Offline models, sovereign deployment and edge inference already exist in the library. Add a complete, tested language-pair bundle that can explain its boundaries and switch to cloud inference only under explicit policy. The deliverable is dependable constrained operation, not a smaller generic chatbot.

Customer scenario: a field service worker uses a low-cost Android device with no connection. In a released corridor the app transcribes and translates an in-scope message, confirms uncertain quantities and shows the original. Outside scope it asks for clarification or reports unsupported capability instead of generating an authoritative answer.

## Model bundle and device scope

Start with one Android device class with 4GB RAM and one batch or push-to-talk corridor. Bundle a compact recognizer, translation model/adapter, lightweight Fidelity checks, pronunciation resources, and optional compact TTS. Streaming comes later if device tests justify it.

Benchmark actual model-memory allocation, tokenizer/frontend buffers, caches and application overhead. Proposed target is at most 2GB process peak memory on the declared device, subject to quality and stability review. Do not promise that a 1-3B model plus ASR and TTS will fit without measurements. Evaluate native CPU/accelerator support rather than assuming GPU availability.

## Distillation and validation

Use approved teacher outputs with native review, ensuring teacher terms allow training derivatives. Distill translations and intermediate alignment into a smaller eligible student. Start with post-training quantization, then quantization-aware training only if quality drops materially. Compare precision modes on negations, quantities, tonal words and noisy audio; average sentence similarity can hide critical errors.

Train rejection and clarification behavior explicitly. Retain independent human evaluation audio; do not use only teacher-generated test material. Device noise, microphone variation, low battery, background load and thermal throttling are part of the dataset and test matrix.

## Runtime and package contract

Signed pack manifest: pack/version, task directions, variety, hashes, model/license references, minimum runtime/device, disk size, peak RAM, measured speed, calibration scope and rollback compatibility. Verify signatures and hashes before loading. Permit interrupted downloads to resume; atomically switch pack versions. Older revoked packs follow explicit expiry/availability policies.

The application exposes `local`, `cloud_allowed`, and `cloud_forbidden` modes. It must not upload raw audio or translations during connectivity restoration unless an authorized action permits it. If cloud is allowed, display the transition and required disclosure. Keep local corrections encrypted and separate from opt-in model-improvement contributions. Offline installation and license expiry must be designed intentionally.

## Release gates and economics

Report p50/p95 end-to-end push-to-talk completion time, real-time factor where applicable, peak memory, energy per successful utterance, thermal behavior and offline task fidelity. Compare student with current Lugemi cloud under matched input scope and with other eligible edge baselines. Cloud quality does not automatically transfer to the device.

Proposed gate: no more than a five-percentage-point absolute loss in critical entity accuracy against the declared cloud baseline, no silent fallback in cloud-forbidden tests, and compliance with the measured memory budget. Critical meaning-error bounds in 09 still apply. Release on a limited device list rather than “works on every phone.”

Quantify total cost including pack distribution, updates, support and device-specific engineering. Stop if maintaining runtime/device combinations costs more than the design partner's measured offline benefit. Do not market offline availability or private deployment as a competitor-absent feature without a fresh competitive audit.


---

# Lugemi Grounded Interpreter: speech plus the selected visual referent

Priority: fourth | Family: Fusion + Vision + Vector + Translate

## Exact addition

OCR, image translation, multimodal models and RAG already exist. Add a trained mechanism that connects a spoken reference such as “this charge” or “the second instruction” to the user's selected document region, translates only that grounded content, and flags conflicts between speech and the document.

Pilot customer scenario: a person points to a bill while speaking a mixed-language question. The interpreter identifies the selected line, preserves the bill's amount/currency, translates the question, and distinguishes what the document says from what the person is asking. It must not invent an explanation of the fee.

## Scope and pipeline

Begin with image/PDF regions and explicit taps, not camera gestures or gaze inference. A region selector supplies page coordinates; OCR returns tokens, bounding boxes and confidence. A multilingual referent resolver aligns the utterance with selected regions and nearby context. Retrieval is confined to authorized content. Translation uses explicit source spans; Fidelity checks discrepancies between spoken and printed entities.

Return separate `document_evidence`, `speaker_claim` and `translation`. When visual context is missing or conflicting, request selection or clarification. Text embedded in the document is untrusted and cannot instruct the interpreter to ignore policy. General questions about the document require a separately invoked grounded-answer task.

## Models and training

Compare deterministic region selection plus OCR and translation against a trained multimodal adapter. Use existing cross-modal embeddings as a retrieval baseline; add a region/text cross-encoder or vision-language adapter only where necessary.

Collect an initial 5,000 consented or appropriately licensed document-region/utterance/translation examples per pilot corridor. Include blurry scans, multiple similar rows, mixed scripts, handwriting where supported, misleading surrounding text and missing evidence. This is a pilot planning target. Annotate the referenced region, source tokens, spoken intent, translations and “unresolvable” cases. Split by document template, source organization and speaker to prevent template memorization.

Train region alignment, referent ranking, contradiction labels and abstention. Evaluate OCR errors separately from referent errors and translation errors. Expand to video or camera interaction only after explicit selected-region grounding performs reliably.

## Proposed API

`POST /v1/grounded/interpret`: authorized document reference, selected page/region, audio or text reference, source/target languages and operation mode. Return a versioned region ID, bounding boxes, source evidence offsets, resolved referent or null, translated content, discrepancy flags and review decision. Raw documents and embeddings remain workspace-isolated.

No unattended camera recording. A changed document hash invalidates old region evidence. Do not silently use another workspace's terminology or nearest vector match. UI highlights the referenced area and provides “wrong region” correction.

## Evaluate and decide

Measure referent selection accuracy, exact amount/unit preservation, unresolvable-case rejection, evidence sufficiency, task success and added latency. Test held-out layouts and new speakers. Source S7 offers relevant African-language embedding research; it is not evidence this multimodal task is solved.

Proposed pilot gate: at least 90% correct referent resolution on the in-scope set and at least 90% rejection of intentionally unresolvable references, while meeting Fidelity's accepted-risk criterion. Compare at matched rejection coverage and report all denominators. Stop if a simple tap/OCR cascade gives equivalent task results; ship the smaller system and concentrate research on the unresolved cases.

This is assistive document communication, not automated diagnosis, contract approval or financial advice. Those are separate products with separate validation requirements.


---

# Lugemi data advantage: acquire the errors competitors cannot easily reproduce

Status: shared prerequisite for all model briefs | Extend existing Dataset Cloud and MLOps

## The defensible asset

The advantage is not a promise to own every conversation. Build a permissioned corpus of authentic switches, local names, tonal contrasts, corrected quantities, pragmatic misunderstandings and streaming repair trajectories, connected to independently reviewed outcomes. Ordinary transcripts alone do not teach a model which mistakes matter.

Your existing dataset marketplace, annotation, licensing, continuous-learning and regional-knowledge services are the substrate. Add the following acquisition and release workflow; do not create parallel infrastructure.

## Dataset streams

| Stream | What to capture | Main use |
| --- | --- | --- |
| Mixed conversation | Real switching, borrowing, self-correction and acoustic conditions | Mix |
| Meaning contrasts | Changed negations, amounts, units, obligations and entity identity | Fidelity |
| Timed interpretation | Input timestamps, valid commit points, corrections and actual listener playback | Live |
| Intent and register | Requests, refusals, uncertainty, conditional promises and reviewed alternatives | Pragmatics |
| Language acquisition | Learning curves, new speakers, varieties, orthographies and annotator effort | Language Kit |
| Device conditions | Real microphone, compression, memory, energy and offline behavior | Edge |
| Grounded regions | Selected region, OCR evidence, spoken reference and contradiction labels | Grounded |

## Rights and contributor contract

Recruit paid language leads and speakers under understandable agreements. Track distinct permissions for service processing, storing recordings, model training, voice synthesis/cloning, external evaluation, publication and redistribution. One checkbox does not authorize all uses. Respect restricted community knowledge and local review processes. No cloning is required to contribute transcription examples.

Maintain `contributor_id`, agreement/policy version, permitted purposes, territories or other restrictions, expiry where applicable, compensation record, withdrawal status and contact route. Voiceprints are not necessary for ordinary corpus participation; use authenticated contributor/session IDs for splits. Minimize identifying data and separate identity from training records.

Withdrawal stops future collection and unauthorized new training. Identify affected manifests, retraining candidates, deployments and distributed packs. Do not promise immediate removal of influence from every existing model. Track remedy completion and inform affected owners. Rights enforcement is a service workflow, not a claim of legal compliance by itself.

## Record contract

```json
{
  "record_id": "record_example",
  "dataset_version": "mix-pilot-1",
  "artifact_hash": "example_hash_not_a_real_hash",
  "speaker_group_id": "speaker_pseudonym",
  "session_group_id": "session_pseudonym",
  "source_language_tags": ["en", "yo"],
  "variety_id": "reviewed_registry_reference",
  "label_status": "adjudicated",
  "permission_policy_ref": "policy_example",
  "allowed_training_families": ["echo", "translate"],
  "synthetic": false,
  "split": "train",
  "review_manifest_ref": "review_example"
}
```

Examples in this pack illustrate schemas; they are not seed training data or real credentials. Evidence spans, alternative translations, timestamps and error labels live in separately versioned schemas. Validate language tags against the registry and standards rather than copying illustrative metadata into production.

## Pipeline and security

Ingest -> permission validation -> malware/media validation -> PII treatment -> exact/near-duplicate grouping -> candidate split assignment -> annotation -> adjudication -> frozen release. Deduplication and group assignment happen before train/test split; labels can then be completed by teams separated from model training. Keep source hashes and transformations for traceability.

Near duplicates include transcript paraphrases, clipped versions of the same call, translated variants and synthetic descendants. All descendants inherit source split and rights restrictions. Retain raw originals only under a documented restricted policy. Do not store private transcripts in telemetry or public model cards. Annotators receive least-privilege access to approved records.

## Annotation quality

Use two qualified reviewers for consequential labels and an adjudicator for disagreement. Record original text, normalized evaluation text and acceptable variants separately. Do not erase tone marks from training merely to reduce WER. Track label disagreement and assess whether the task definition is stable enough to train.

Measure annotator calibration using native-designed gold items and periodic double review, without penalizing valid dialect differences. Pay for ambiguity discovery as well as completed labels. Disagreement can mean legitimate regional variation rather than annotator failure.

## Error acquisition loop

1. In a consented pilot, record authorized error categories and evidence references.
2. Sample a balanced set by corridor, severity, variety, device and channel; keep random samples for unbiased prevalence estimation.
3. Invite authorized correction and independently review it. User feedback is not automatically ground truth.
4. Score candidates for representativeness and expected quality gain per annotation hour.
5. Train offline with versioned manifests; test against untouched holdouts.
6. Shadow the candidate under tenant policy. Promote through existing canary/rollback controls.

No silent online gradient updates from live customer conversations. Protect against deliberate poisoning, glossary prompt injection, malicious labels, false consent and coordinated feedback. Evaluate performance on unselected random samples, not only on the interesting errors the sampler found.

## Cost, milestones and acceptance

Track cost per approved audio hour, reviewed sentence pair, adjudicated critical-error example and demonstrated held-out gain. Include rejected recordings, reviewer time, permission work and contributor payment. Data targets in model briefs are acquisition seeds; adjust from measured learning curves rather than buying an arbitrary enormous corpus.

Release a pilot dataset only when every included item has enforceable permitted-purpose metadata, source grouping, independent review appropriate to its severity and a split audit. Run export-denial tests for incompatible licenses and withdrawn contributors. Success is a reproducible artifact with improved downstream quality, not a rising dataset row count.

Sources S6-S8 in 00_START_HERE inform evaluation and regional research. Negotiate or verify rights for any external dataset independently. Research availability does not imply transferable commercial rights.


---

# Lugemi advantage protocol: prove the win before claiming it

Status: mandatory evaluation contract | Extend the existing evaluation and research platforms

## Claim boundary

“Outperform ElevenLabs” is too broad to be a useful gate. Test a named task, corridor, variety, domain, device, input distribution, model/version, date and quality/cost operating point. A product can win one corridor and lose another. A missing competing capability is a coverage difference, not an accuracy score of zero.

The supplied libraries are architecture/specification documents. Treat the user-reported build completion as the baseline inventory assumption. Require actual model artifacts, production traces and native-speaker evaluations to establish current performance. Do not reuse the older repository scan's language counts as if they describe this newly reported build.

## Comparison matrix

| Task | Lugemi baseline | External comparison | Rule |
| --- | --- | --- | --- |
| Mixed-language ASR | Existing Echo/gateway recognizer | Current API-accessible Scribe batch/realtime model appropriate to input | Match audio, vocabulary hints, endpoint class and language availability |
| Translation fidelity | Existing Translate and glossary | Eligible MT/translation models plus reviewed interpreter reference | Compare translation tasks; a TTS service is not an MT comparator |
| Voice quality | Existing Voice | Current API-accessible ElevenLabs synthesis model appropriate to language and use | Match script, permitted voices, bitrate, generation settings and target-language support |
| Batch dubbing | Existing Lugemi media pipeline | Current ElevenLabs dubbing workflow if target/source supported | Match source media, direction, edit allowances and output task |
| Live interpreted conversation | Existing Lugemi cascade | Matched composed pipeline using Scribe + the same MT + appropriate synthesis, and other available streaming baselines | Label a composed workflow; do not imply it is ElevenLabs' native interpreter |
| Offline task | Current Edge pack | Commercially eligible on-device baseline | Cloud-only execution is not an equivalent offline test |

Run both component-isolation comparisons and end-to-end comparisons. Holding MT constant isolates ASR/TTS gains; changing all components tests a product workflow but does not identify which model caused the change. Source S1 documents model capabilities; use actual accessible IDs at execution rather than assuming a documentation listing is callable in the account.

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

Proposed superiority claim format: “On [frozen dataset/version], [corridor/task], Lugemi [version] reduced [defined error] by [measured change], versus [actual comparable model/configuration], at [coverage/latency/cost], tested [date], with [interval].” Publish the denominator and important exclusions. Never translate a narrow win into “best for all African languages” or “better than ElevenLabs at everything.”

## Required artifacts and integration tests

Produce dataset/split hash manifest, permissions review, model IDs/configs, scoring code, immutable raw results, adjudication records, confidence calculations, hardware/network profile, cost assumptions and reproducible comparison report. Record secrets outside artifacts; redact identifying examples.

Mandatory integration cases: unsupported language; mixed-language unknown span; ambiguous amount; late negation; silence; disconnect/reconnect; cancellation during playback; tenant-crossing document reference; withdrawn training permission; stale glossary version; corrupted edge pack; cloud-forbidden mode; document prompt injection; unresolvable visual reference. Each must have a concrete expected behavior, not merely “returns 200.”

The first investment decision is based on a real held-out gain versus existing Lugemi. The second is based on a fair external comparison. The third is based on paying design-partner task outcomes. All three are necessary to turn model research into a durable commercial advantage.
