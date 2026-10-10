# Lugemi Android SDK (Kotlin)

Official Android / Kotlin client for Lugemi speech, translate, ASR, detect, streaming translate, **VoiceBridge**, and **DealBridge**.

## Install

**Option A — copy sources** into your app module (`com.lugemi.sdk` package).

**Option B — Maven publish** from this folder:

```bash
cd packages/sdk-android
gradle publishToMavenLocal
```

Then in your app:

```kotlin
dependencies {
  implementation("com.lugemi:sdk-android:0.2.0")
}
```

Requires `INTERNET` permission. On Android, `org.json` is bundled.

## Core APIs

| Method | HTTP |
| --- | --- |
| `speech` / `speechStream` | `POST /v1/audio/speech` |
| `translate` / `translateStream` | `POST /v1/translate` (+ SSE `/stream`) |
| `detect` | `POST /v1/detect` |
| `transcribe` | `POST /v1/audio/transcriptions` |
| `recognizeSpeech` | `POST /v1/speech/recognize` |
| `languages` / `voices` | catalog |
| `videoVoiceLine` | translate + speech |

Typed results: `SpeechResult`, `TranslateResult`, `DetectResult`, `TranscribeResult`, `SpeechRecognizeResult`.  
Errors: `LugemiException` with `code`, `status`, `isConflict`, `isFeatureDisabled`, `isAuthError`.

## VoiceBridge / DealBridge

`client.voiceBridge` and `client.dealBridge` cover threads/sessions, invites, drafts/turns (text + audio), publish/correct, acknowledgments, deal confirmations.  
Use `createAudioDraftResumable` / `createAudioTurnResumable` for retry + progress (honors upload-auth limits).

```kotlin
val client = LugemiHttpClient(
  apiKey = BuildConfig.LUGEMI_API_KEY,
  actorId = "merchant-user-1",
  organizationId = orgId,
  workspaceId = workspaceId,
)

val lang = client.detect("Bonjour le monde")
val asr = client.transcribe(bytes, "clip.m4a", "audio/mp4", language = "fr")
client.translateStream(TranslateRequest(text = "Hello", source = "en", target = "fr")).forEach { ev ->
  // TranslateStreamEvent.Chunk / Done / …
}

val thread = client.voiceBridge.createThread(title = "Rice desk", language = "en")
```

Auth: `Authorization: Bearer lg_live_…` / `lg_test_…`.
