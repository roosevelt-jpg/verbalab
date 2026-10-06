# Lugemi iOS SDK (Swift)

Official Swift client for Lugemi speech, translate, and speaking agents on iOS / macOS.

## Status

Scaffold ready. Same REST surface as `@lugemi/sdk` and the Android Kotlin stub.

## Install (planned)

Swift Package Manager: `https://github.com/lugemi/lugemi-swift` (publish when ready)

## Usage sketch

```swift
let client = LugemiClient(apiKey: ProcessInfo.processInfo.environment["LUGEMI_API_KEY"] ?? "")

let audio = try await client.speech(
  text: "Habari, dunia.",
  voice: "own:sw-ke-female"
)

let translated = try await client.translate(
  text: "Build speaking agents",
  source: "en",
  target: "sw"
)
```

See `Sources/Lugemi/LugemiClient.swift`.
