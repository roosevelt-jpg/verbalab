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
