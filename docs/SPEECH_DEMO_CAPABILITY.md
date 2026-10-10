# Lugemi speech demos — capability matrix & honesty

## Root causes (affected demos)

| Symptom | Layer | Cause | Fix |
|--------|-------|-------|-----|
| Strange “speech-like” noise | Local fixture TTS | Formant synthesizer used when eSpeak voice missing (Yo/Zu/Ak/Ig/…) | Capability gate: demos refuse formant; catalogue uses eSpeak-safe voices only |
| Beeps / garbage audio | VoiceBridge / DealBridge fixture | `Buffer.from('fixture-tts:…')` labeled `audio/wav` | Generate real WAV via `generateSpeechWav` |
| Echo / hang / wrong duration | eSpeak `--stdout` WAV | Streaming placeholder RIFF/data sizes (~2GB claimed) | `finalizeStreamingWav` rewrites sizes to buffer length |
| Wrong language accent | `own-tts.adapter` routing | Substring `ng`/`ke`/`za` matched Yoruba (`yo-ng`) as Nigerian English | Registry-based locale mapping; no neighboring-language substitutes |
| Zulu sounding like Afrikaans | `services/tts` eSpeak map | Explicit `zu → af` substitute | Removed; Zulu requires neural checkpoint |
| Catalog claimed `live` | Voice status | All `own:*` marked live without weights | Status: `live` / `demo` / `placeholder` + verification headers |

## Engines (reuse only Lugemi paths)

| Engine | When used | Quality claim |
|--------|-----------|---------------|
| Kokoro / Piper (`OWN_TTS_URL` + weights) | Speech engine lists voice | Neural (still needs native review for approved catalogue) |
| eSpeak-NG | Fixture / demo fallback with verified voice | Intelligible **demo**; not native-reviewed neural |
| Formant | Internal/tests only when allowed | **Placeholder** — not customer-demo-safe |

No third-party TTS replacements were added.

## Demo-safe languages (no neural weights required)

American / British / Australian / New Zealand English, Ghanaian & Nigerian English (eSpeak Caribbean approximation — labeled honestly), Kiswahili, Amharic, Arabic, French (France / Senegal routing), Afrikaans.

## Not demo-safe until neural checkpoints publish

Yoruba, isiZulu, Akan/Twi, Igbo, Hausa, Wolof, Pidgin, and other formant-only curated IDs remain in the Echo catalog with `status: placeholder` and return `capability_unavailable` on `POST /v1/demo/speech`.

## API surfaces

- `GET /v1/demo/speech/capabilities` — honest catalogue
- `POST /v1/demo/speech` — requires intelligible path; sets `X-Lugemi-Synth-Engine`, `X-Lugemi-Verification-Status`, `X-Lugemi-Synthetic-Speech`
- `GET|POST /v1/speech-review` (platform admin) — native-speaker review records; `trainingEligible` always false

## Setup (no secrets)

```bash
# API image already installs espeak-ng. Locally:
sudo apt-get install -y espeak-ng espeak-ng-data

# Optional neural engine (existing Lugemi service — not a new vendor):
# fly secrets set -a verbalab OWN_TTS_URL=http://lugemi-tts.internal:8080
# Place Kokoro/Piper weights under services/tts models paths (see services/tts/README.md).
```

## Rollback

Revert the capability-registry / demo-catalogue commits; restore prior `DEMO_VOICE_PROFILES` if needed. Formant fallback remains available for internal synthesize when `requireIntelligible` is not set.

## Training note

No automatic fine-tuning from customer audio or reviewer notes. A training release requires consented data, dataset review, checkpoint comparison, and explicit promotion — see `services/tts/training/`.
