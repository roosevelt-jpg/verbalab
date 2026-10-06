# Language Intelligence (VL-144 / Phase 12)

Unified Language Intelligence façade over existing detection products plus heuristic NLP signals. **Not** a full NLP research platform, voice-emotion product, or trained NLU suite.

## Catalog

`GET /v1/language-intelligence`

## Capabilities

| Capability | Status | API |
| --- | --- | --- |
| Language detection | shipped | `POST /v1/detect` (+ analyze) |
| Dialect detection | shipped | `POST /v1/dialects/detect` |
| Accent detection | shipped | `POST /v1/accents/detect` |
| Intent | partial | `POST /v1/language-intelligence/intent` |
| Sentiment | partial | `POST /v1/language-intelligence/sentiment` |
| Emotion | partial | `POST /v1/language-intelligence/emotion` |
| Readability | shipped | `POST /v1/language-intelligence/readability` |
| Complexity | shipped | `POST /v1/language-intelligence/complexity` |
| Translation confidence | shipped | `POST /v1/language-intelligence/translation-confidence` |
| Speech confidence | partial | `POST /v1/language-intelligence/speech-confidence` |

## Analyze

`POST /v1/language-intelligence/analyze`

```json
{
  "text": "Thank you! Can you please translate this?",
  "includeDialect": true,
  "includeAccent": false
}
```

Returns language + optional dialect/accent + intent/sentiment/emotion/readability/complexity.

## Realtime (SSE)

`POST /v1/language-intelligence/analyze/stream` — `text/event-stream` events: `start`, `language`, `sentiment`, `emotion`, `intent`, `readability`, `complexity`, `dialect`, `accent`, `done`.

## GraphQL

- `languageIntelligence`
- `analyzeLanguage`

## SDK

```ts
await client.languageIntelligence();
await client.analyzeLanguage({ text });
await client.languageSentiment({ text });
await client.translationConfidence({ sourceText, targetText, sourceLang, targetLang });
await client.speechConfidence({ transcript });
```

## Dashboard

`/language-intelligence`

## Honesty bounds

- Intent / sentiment / emotion are **lexicon/heuristic** — not production NLP models.
- Emotion is **text cues only** — not acoustic emotion recognition.
- Speech confidence is transcript heuristics (+ optional client STT score); Whisper path has no native confidence.
- Translation confidence reuses the existing quality-estimate heuristic — not a trained QE model.
