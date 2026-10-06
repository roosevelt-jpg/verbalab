# Lugemi Android SDK (Kotlin)

Official Android / Kotlin client for Lugemi speech, translate, and video voice lines.

## APIs

| Method | HTTP |
| --- | --- |
| `speech` | `POST /v1/audio/speech` |
| `translate` | `POST /v1/translate` |
| `languages` | `GET /v1/languages` |
| `voices` | `GET /v1/audio/voices` |
| `videoVoiceLine` | translate + speech (dubbing helper) |

## Install

Copy `LugemiClient.kt` into your app module, or publish as `com.lugemi:sdk` when ready.

Requires `org.json` (bundled on Android) and `INTERNET` permission.

```kotlin
val client = LugemiHttpClient(
  apiKey = BuildConfig.LUGEMI_API_KEY,
  baseUrl = "https://api.lugemi.com",
)

// Video / content production
val (translated, audio) = client.videoVoiceLine(
  text = "Welcome to Accra",
  target = "ak",
  voice = "own:ak-gh-female",
  source = "en",
)
// audio.audio → ByteArray (mp3) for ExoPlayer / MediaPlayer
```

Auth: `Authorization: Bearer lg_live_…` (or `lg_test_…`).

Same contracts as `@lugemi/sdk`, `@lugemi/cli`, and `@lugemi/mcp`.
