# Lugemi Android SDK (Kotlin)

Official Android / Kotlin client for Lugemi speech, translate, and voice agents.

## Status

Scaffold ready for video and mobile apps. Mirrors `@lugemi/sdk` HTTP surface:

- `POST /v1/audio/speech`
- `POST /v1/translate`
- `POST /v1/detect`
- `GET /v1/languages`
- `POST /v1/voice/simulate`

## Install (planned)

```kotlin
implementation("com.lugemi:sdk:0.1.0")
```

## Usage sketch

```kotlin
val client = LugemiClient(
  apiKey = BuildConfig.LUGEMI_API_KEY,
  baseUrl = "https://api.lugemi.com",
)

val speech = client.speech(
  text = "Habari, dunia.",
  voice = "own:sw-ke-female",
)

val translated = client.translate(
  text = "Build speaking agents",
  source = "en",
  target = "sw",
)
```

Auth header: `Authorization: Bearer lg_live_…`  
Workspace header (optional): `X-Lugemi-Workspace-Id`

See `LugemiClient.kt` for the typed stub interface.
