# @lugemi/sdk

TypeScript client for the **Lugemi API** (`@lugemi/sdk`, v0.3.0). Generate speech, transcribe, translate, and drive **Voice Studio** workspace APIs with `lg_live_` / `lg_test_` keys (legacy `vl_*` prefixes still accepted). Not a vendor-SDK wrapper.

```ts
import { Lugemi } from '@lugemi/sdk';

const client = new Lugemi({
  apiKey: process.env.LUGEMI_API_KEY!,
  baseUrl: process.env.LUGEMI_BASE_URL ?? 'http://localhost:3001',
});

const result = await client.translate({
  text: 'Hello',
  source: 'en',
  target: 'sw',
});

await client.detect({ text: 'Habari' });
await client.regions();
await client.locales();
await client.localize({ source: 'en', target: 'sw', content: { hello: 'Hello' } });
await client.createJob({
  type: 'batch_translate',
  input: { source: 'en', target: 'sw', items: [{ id: '1', text: 'Hi' }] },
});

const speech = await client.speech({ text: 'Hello', voice: 'alloy' });
// speech.audio is Uint8Array
```

Also: `chat`, `embeddings`, `languages`, `ocr`, `transcribe`, `recognizeSpeech`, `interpret`, `voices`,
`listJobs`, `getJob`, `platformConnectors`, `platformConnector`, `platformConnectorDemo`,
`ttsSynthesize`, `listVoiceClones`.

### Voice Studio

```ts
await client.voiceStudioWorkspaceCapabilities();
await client.createVoiceStudioWorkspaceProject({ name: 'Announcement', sourceLanguage: 'en' });
await client.voiceStudioWorkspaceProjects();
```

Android / iOS expose the full workflow via `client.voiceStudio` (v0.3.0).

#

## AccessLine

`client.accessLine` — business lines, simulator call journey (DTMF/speech), grounded delivery lookup, allowlisted handoff.
Live PSTN webhooks require Twilio credentials and separate pilot authorization.

## VoiceBridge & DealBridge

Same REST surface as the Android/iOS SDKs:

```ts
const client = new Lugemi({
  apiKey: process.env.LUGEMI_API_KEY!,
  actorId: 'merchant-user-1',
  organizationId: orgId,
  workspaceId: workspaceId,
});

const thread = await client.voiceBridge.createThread({
  title: 'East Africa rice desk',
  language: 'en',
  category: 'wholesale_rice',
});

const draft = await client.voiceBridge.createTextDraft(thread.thread.id as string, {
  text: 'We can deliver 50 bags',
});

const session = await client.dealBridge.createSession({
  merchantLanguage: 'en',
  buyerLanguage: 'fr',
  category: 'wholesale_rice',
});
```

Use `createAudioDraftResumable` / `createAudioTurnResumable` for retry + progress.  
`LugemiError` exposes `isConflict`, `isFeatureDisabled`, and `isAuthError`.

Platform connector guides (Studio Connectors hub):

```ts
const registry = await client.platformConnectors();
const guide = await client.platformConnector('livekit');
await client.platformConnectorDemo('africas-talking', { text: 'Hello', target: 'ak' });
```

Python stubs live in `packages/sdk-python`.

See repo `.env.example` for API credentials.
