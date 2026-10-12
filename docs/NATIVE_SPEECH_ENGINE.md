# Lugemi Native Speech Engine

Shared speech infrastructure: dialect-aware recognition, meaning-preserving translation, native pronunciation routing, prosody-aware synthesis, and audio delivery with integrity checks. Integrates existing OWN TTS / eSpeak / Kokoro / Piper assets — does not fabricate coverage or auto-fine-tune on private speech.

## Capabilities

| Task | Endpoint | Notes |
|------|----------|-------|
| Capability registry | `GET /v1/speech/capabilities` | Task/variety status, honesty rules |
| Native evaluation plan | `GET /v1/speech/evaluation` | Review dimensions; fine-tune honesty |
| Beep/echo diagnosis | `POST /v1/speech/diagnose` | Payload / codec / capability layers |
| Text → speech | `POST /v1/speech/syntheses` | Verified path + optional demo remap |
| Speech → text | `POST /v1/speech/recognitions` | Advisory dialect cues; no nationality inference |
| Speech translation | `POST /v1/speech/speech-translations` | Source accent not copied into target |
| Text translation | `POST /v1/speech/translations` | Meaning-preserving; no invented emotion |

Customer-facing Play continues on `POST /v1/demo/speech`, which routes through the same engine (`X-Lugemi-Engine: native_speech_engine`).

## Honesty rules

- Source recognition and target synthesis are independent.
- Translation support is not TTS support.
- Formant placeholders never pass intelligible demos — remapped to cultural English/French of the same country.
- Technical decode ≠ native-quality approval (`approved_for_task` requires native review).
- Fine-tuning never auto-ingests private speech or reviewer notes (see `services/tts/training/`).
- `streaming_interpretation` remains `limited` until cancel/ack/epoch lifecycle tests land.

## Diagnosis layers

When demos beep, echo, or sound unintelligible, diagnose before retraining:

1. **Weights** — missing checkpoint / vocoder
2. **Inference** — wrong language token or voice ID
3. **Payload** — JSON/HTML/fixture labeled as audio
4. **Codec** — bad WAV headers, streaming RIFF size mismatch, near-silence
5. **Capability** — formant blocked for demo; remap or refuse

## Platform demos

All marketing / Studio Play paths (`useDemoPlayer`, Accent Identity, hero TTS, Translate Play, Creative tools using `playDemoSpeech`) share this engine. Remaps surface via `X-Lugemi-Demo-Remapped` and UI status copy.

See also: `docs/SPEECH_DEMO_CAPABILITY.md`.

## Deploy note

Production Deploy is triggered from `main`. If a Fly release_command VM fails to start, re-push or re-run the Deploy workflow.
