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
