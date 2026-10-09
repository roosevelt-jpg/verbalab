# Lugemi speech engine

Self-hosted text-to-speech for every `own:*` voice. Runs as the private Fly app `lugemi-tts`;
the API reaches it at `OWN_TTS_URL=http://lugemi-tts.internal:8080`. No third-party speech API is called.

| Voices | How they are produced |
| --- | --- |
| English · United States, United Kingdom (male + female) | Kokoro v1.0 open weights (Apache-2.0), bundled in the image |
| English · Canada, Australia, New Zealand; Ghanaian English; every African voice | Trained by Lugemi on its own native-speaker recordings, published below |

A voice is **live** only when the engine serves it. Everything else is listed as **in training**
and the API refuses it (`native_voice_unavailable`) rather than substituting a foreign voice.

## Making a voice live

1. **Record.** Admin → Voice data: create speaker links for the dialect (`en-au`, `ak-gh-asante`, …),
   add prompt sentences, approve good takes. One speaker per voice; 1 h minimum, 3 h+ for premium quality.
2. **Export** (operator machine with `ffmpeg`, `pip install -r training/requirements.txt`):
   `python training/export_dataset.py --dialect en-au --speaker <id> --out data/en-au-female`
3. **Train** on a rented GPU with the Piper trainer (`pip install piper-tts[train]` or the
   `OHF-Voice/piper1-gpl` repo). Start from a base checkpoint whose training data allows commercial use:
   `training/train_voice.sh en-au-female data/en-au-female en-gb base.ckpt`
   (espeak voice: `en-us` for US/Canada, `en-gb` for UK/Australia/New Zealand; check `espeak-ng --voices`
   for other languages). It exports the ONNX voice and renders held-out review sentences.
4. **Native review.** A native speaker from that country listens to the review files. Publish only after they approve.
5. **Publish:** `python training/publish_voice.py --voice-id en-au-female --model runs/en-au-female/en-au-female.onnx --name "Mia · Australia" --locale en-AU --gender female --approved-by "<reviewer>" --engine-url http://localhost:18080`
   (`fly proxy 18080:8080 -a lugemi-tts` first). The voice id is the catalog id without `own:`.

## API

- `POST /` `{ text, voice, language?, format?: mp3|wav|opus|aac|flac, speed? }` → audio
- `GET /voices` → live voices · `POST /admin/reload` → re-sync trained voices · `GET /health`
- `Authorization: Bearer $TTS_API_KEY` on everything except `/health`.

Tests run real synthesis in Docker: `docker build --target test -t lugemi-tts-test . && docker run --rm lugemi-tts-test`.
