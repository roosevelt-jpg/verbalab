# Lugemi Android SDK (Kotlin)

Official Android / Kotlin client for Lugemi speech, translate, video voice lines, **VoiceBridge**, and **DealBridge**.

## Core APIs

| Method | HTTP |
| --- | --- |
| `speech` | `POST /v1/audio/speech` |
| `translate` | `POST /v1/translate` |
| `languages` | `GET /v1/languages` |
| `voices` | `GET /v1/audio/voices` |
| `videoVoiceLine` | translate + speech (dubbing helper) |

## VoiceBridge (`client.voiceBridge`)

Threads, invites, join, text/audio drafts, publish, corrections, acknowledgments, DealBridge handoff.

| Method | HTTP |
| --- | --- |
| `createThread` / `listThreads` / `getThread` | `/v1/voicebridge/threads` |
| `createInvite` / `join` / `patchMemberMe` | invites + membership |
| `createTextDraft` / `createAudioDraft` | `POST .../messages` |
| `publishMessage` / `correctMessage` | publish + corrections |
| `acknowledgeRevision` / `recordPlayback` | revision telemetry |
| `createDealDraft` | DealBridge draft handoff |

Set `actorId` (and optional org/workspace ids) on `LugemiHttpClient` for API-key actors.

## DealBridge (`client.dealBridge`)

Sessions, consents, turns, snapshots, checks, confirmations, receipts.

| Method | HTTP |
| --- | --- |
| `createSession` / `listSessions` / `getSession` | `/v1/dealbridge/sessions` |
| `createInvite` / `join` / `recordConsent` | membership |
| `createTextTurn` / `createAudioTurn` / `correctTurn` | conversation turns |
| `proposeSnapshot` / `submitCheck` / `confirm` | deal flow |
| `getReceipt` / `startRevision` / `requestDeletion` | receipt + lifecycle |

## Install

Copy the Kotlin sources in this folder into your app module, or publish as `com.lugemi:sdk` when ready.

Requires `org.json` (bundled on Android) and `INTERNET` permission.

```kotlin
val client = LugemiHttpClient(
  apiKey = BuildConfig.LUGEMI_API_KEY,
  baseUrl = "https://api.lugemi.com",
  actorId = "merchant-user-1",
  organizationId = orgId,
  workspaceId = workspaceId,
)

// Speech / dubbing
val (translated, audio) = client.videoVoiceLine(
  text = "Welcome to Accra",
  target = "ak",
  voice = "own:ak-gh-female",
  source = "en",
)

// VoiceBridge
val thread = client.voiceBridge.createThread(
  title = "East Africa rice desk",
  language = "en",
  category = "wholesale_rice",
)
val draft = client.voiceBridge.createTextDraft(
  threadId = thread.getJSONObject("thread").getString("id"),
  text = "We can deliver 50 bags",
)
// review → publishMessage → correctMessage as needed

// DealBridge
val session = client.dealBridge.createSession(
  merchantLanguage = "en",
  buyerLanguage = "fr",
  category = "wholesale_rice",
)
```

Auth: `Authorization: Bearer lg_live_…` (or `lg_test_…`).

Same contracts as `@lugemi/sdk`, `@lugemi/cli`, and `@lugemi/mcp`.
