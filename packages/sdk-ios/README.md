# Lugemi iOS SDK (Swift)

Official Swift Package for Lugemi speech, translate, video voice lines, **VoiceBridge**, and **DealBridge** on iOS / macOS.

## Core APIs

| Method | HTTP |
| --- | --- |
| `speech` | `POST /v1/audio/speech` |
| `translate` | `POST /v1/translate` |
| `languages` | `GET /v1/languages` |
| `voices` | `GET /v1/audio/voices` |
| `videoVoiceLine` | translate + speech (dubbing helper) |

## VoiceBridge (`client.voiceBridge`)

| Method | HTTP |
| --- | --- |
| `createThread` / `listThreads` / `getThread` | `/v1/voicebridge/threads` |
| `createInvite` / `join` / `patchMemberMe` | invites + membership |
| `createTextDraft` / `createAudioDraft` | `POST .../messages` |
| `publishMessage` / `correctMessage` | publish + corrections |
| `acknowledgeRevision` / `recordPlayback` | revision telemetry |
| `createDealDraft` | DealBridge draft handoff |

## DealBridge (`client.dealBridge`)

| Method | HTTP |
| --- | --- |
| `createSession` / `listSessions` / `getSession` | `/v1/dealbridge/sessions` |
| `createInvite` / `join` / `recordConsent` | membership |
| `createTextTurn` / `createAudioTurn` / `correctTurn` | conversation turns |
| `proposeSnapshot` / `submitCheck` / `confirm` | deal flow |
| `getReceipt` / `startRevision` / `requestDeletion` | receipt + lifecycle |

## Install

Swift Package Manager — add the local package `packages/sdk-ios` or publish when ready.

```swift
import Lugemi

let client = LugemiClient(
  apiKey: ProcessInfo.processInfo.environment["LUGEMI_API_KEY"] ?? "",
  actorId: "merchant-user-1",
  organizationId: orgId,
  workspaceId: workspaceId
)

let (translated, audio) = try await client.videoVoiceLine(
  text: "Welcome to Accra",
  target: "ak",
  voice: "own:ak-gh-female",
  source: "en"
)

let thread = try await client.voiceBridge.createThread(
  title: "East Africa rice desk",
  language: "en",
  category: "wholesale_rice"
)

let session = try await client.dealBridge.createSession(
  merchantLanguage: "en",
  buyerLanguage: "fr",
  category: "wholesale_rice"
)
```

Auth: `Authorization: Bearer lg_live_…` (or `lg_test_…`).

Same contracts as `@lugemi/sdk`, `@lugemi/cli`, and `@lugemi/mcp`.
