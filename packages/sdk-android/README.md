# Lugemi Android SDK (Kotlin)

Official Android / Kotlin client for Lugemi speech, translate, ASR, detect, streaming translate, **VoiceBridge**, **DealBridge**, **Voice Studio**, and **AccessLine**.

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
  implementation("com.lugemi:sdk-android:0.4.0")
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

## Voice Studio

`client.voiceStudio` covers the collaborative workspace: projects, script import, editions, translation, generation, native review, assembly, exact-hash release approval, and WAV export. Also `preview` / `library` / `engine`.

Audio helpers reject JSON/HTML error bodies so apps never play fixture/error payloads as speech.

```kotlin
val studio = client.voiceStudio
val project = studio.createProject(name = "Market announcement", sourceLanguage = "en")
studio.importScript(project.getString("id"), "Welcome to Lugemi.")
val edition = studio.createEdition(
  projectId = project.getString("id"),
  languageVariety = "sw-KE",
  voiceId = "own:sw-ke-female",
)
```



## AccessLine

`client.accessLine` — business lines, simulator call journey (DTMF/speech), grounded delivery lookup, allowlisted handoff.
Live PSTN webhooks require Twilio credentials and separate pilot authorization.

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
