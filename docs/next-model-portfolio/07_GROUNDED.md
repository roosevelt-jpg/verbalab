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
