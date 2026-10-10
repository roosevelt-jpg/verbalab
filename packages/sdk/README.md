# @lugemi/sdk

TypeScript client for the **Lugemi API** (`@lugemi/sdk`). Generate speech, transcribe, and translate with `lg_live_` / `lg_test_` keys (legacy `vl_*` prefixes still accepted). Not a vendor-SDK wrapper.

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

Also: `chat`, `embeddings`, `languages`, `ocr`, `transcribe`, `interpret`, `voices`, `listJobs`, `getJob`,
`platformConnectors`, `platformConnector`, `platformConnectorDemo`, `ttsSynthesize`, `listVoiceClones`.

Platform connector guides (Studio Connectors hub):

```ts
const registry = await client.platformConnectors();
const guide = await client.platformConnector('livekit');
await client.platformConnectorDemo('africas-talking', { text: 'Hello', target: 'ak' });
```

Python stubs live in `packages/sdk-python`.

See repo `.env.example` for API credentials.
