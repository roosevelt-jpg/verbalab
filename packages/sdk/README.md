# @verbalab/sdk

TypeScript client for the **Lugemi API** (historical package name `@verbalab/sdk`). Generate speech, transcribe, and translate with `vl_live_` keys. Not a vendor-SDK wrapper.

```ts
import { VerbaLab } from '@verbalab/sdk';

const client = new VerbaLab({
  apiKey: process.env.VERBALAB_API_KEY!,
  baseUrl: process.env.VERBALAB_BASE_URL ?? 'http://localhost:3001',
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

Also: `chat`, `embeddings`, `languages`, `ocr`, `transcribe`, `interpret`, `voices`, `listJobs`, `getJob`.

See repo `.env.example` for API credentials.
