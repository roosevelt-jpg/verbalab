# Lugemi iOS SDK (Swift)

Official Swift Package for Lugemi speech, translate, ASR, detect, streaming translate, **VoiceBridge**, and **DealBridge** on iOS / macOS.

## Install (SPM)

Add the local package path `packages/sdk-ios`, or a git URL when published:

```swift
dependencies: [
  .package(path: "../packages/sdk-ios")
]
```

Product: `Lugemi` (library). Platforms: iOS 15+, macOS 12+.

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
Errors: `LugemiError.api` with `isConflict`, `isFeatureDisabled`, `isAuthError`.

## VoiceBridge / DealBridge

`client.voiceBridge` / `client.dealBridge` — full session/thread lifecycle.  
`createAudioDraftResumable` / `createAudioTurnResumable` retry with backoff and progress callbacks.

```swift
import Lugemi

let client = LugemiClient(
  apiKey: ProcessInfo.processInfo.environment["LUGEMI_API_KEY"] ?? "",
  actorId: "merchant-user-1",
  organizationId: orgId,
  workspaceId: workspaceId
)

let detected = try await client.detect(text: "Bonjour le monde")
let asr = try await client.transcribe(audio: data, filename: "clip.m4a", mimeType: "audio/mp4", language: "fr")

for try await event in client.translateStream(TranslateRequest(text: "Hello", source: "en", target: "fr")) {
  // TranslateStreamEvent
}

let thread = try await client.voiceBridge.createThread(title: "Rice desk", language: "en")
```

Auth: `Authorization: Bearer lg_live_…` / `lg_test_…`.
