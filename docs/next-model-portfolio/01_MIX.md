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
