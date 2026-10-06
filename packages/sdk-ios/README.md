# Lugemi iOS SDK (Swift)

Official Swift Package for Lugemi speech, translate, and video voice lines on iOS / macOS.

## APIs

| Method | HTTP |
| --- | --- |
| `speech` | `POST /v1/audio/speech` |
| `translate` | `POST /v1/translate` |
| `languages` | `GET /v1/languages` |
| `voices` | `GET /v1/audio/voices` |
| `videoVoiceLine` | translate + speech (dubbing helper) |

## Install

Swift Package Manager — add the local package `packages/sdk-ios` or publish when ready.

```swift
import Lugemi

let client = LugemiClient(apiKey: ProcessInfo.processInfo.environment["LUGEMI_API_KEY"] ?? "")

let (translated, audio) = try await client.videoVoiceLine(
  text: "Welcome to Accra",
  target: "ak",
  voice: "own:ak-gh-female",
  source: "en"
)
// audio.audio → Data (mp3) for AVAudioPlayer / AVFoundation
```

Auth: `Authorization: Bearer lg_live_…` (or `lg_test_…`).

Same contracts as `@lugemi/sdk`, `@lugemi/cli`, and `@lugemi/mcp`.
