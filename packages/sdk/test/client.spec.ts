import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Lugemi, LugemiError } from '../src/index.js';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

describe('Lugemi SDK', () => {
  let baseUrl: string;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const auth = req.headers.authorization;
      if (auth !== 'Bearer lg_live_testkey') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { code: 'unauthorized', message: 'Invalid API key', request_id: 'r1' } }));
        return;
      }

      if (req.method === 'GET' && req.url === '/v1/languages') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            data: [{ code: 'en', name: 'English', rtl: false, tier: 'vendor' }],
          }),
        );
        return;
      }

      if (req.method === 'POST' && req.url === '/v1/detect') {
        const raw = await readBody(req);
        const body = JSON.parse(raw) as { text: string };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            language: 'en',
            confidence: 0.9,
            provider: 'fixture_detect',
            characters: [...body.text].length,
          }),
        );
        return;
      }

      if (req.method === 'POST' && req.url === '/v1/chat/completions') {
        const raw = await readBody(req);
        const body = JSON.parse(raw) as { messages: Array<{ role: string; content: string }> };
        const last = [...body.messages].reverse().find((m) => m.role === 'user');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            id: 'chatcmpl_test',
            object: 'chat.completion',
            model: 'fixture',
            provider: 'fixture_chat',
            choices: [{ index: 0, message: { role: 'assistant', content: `Echo: ${last?.content}` }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
            translated: false,
            translateReplyTo: null,
          }),
        );
        return;
      }

      if (req.method === 'POST' && req.url === '/v1/embeddings') {
        const raw = await readBody(req);
        const body = JSON.parse(raw) as { input: string | string[] };
        const texts = Array.isArray(body.input) ? body.input : [body.input];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            object: 'list',
            data: texts.map((text, index) => ({
              object: 'embedding',
              index,
              embedding: [text.length, index],
            })),
            model: 'fixture-embed',
            provider: 'fixture_embeddings',
            usage: { prompt_tokens: texts.length, total_tokens: texts.length },
          }),
        );
        return;
      }

      if (req.method === 'POST' && req.url === '/v1/translate') {
        const raw = await readBody(req);
        const body = JSON.parse(raw) as { text: string; source: string; target: string };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            text: `[${body.target}] ${body.text}`,
            source: body.source,
            target: body.target,
            provider: 'fixture',
            characters: [...body.text].length,
            glossaryApplied: 0,
            tmHit: false,
            qualityScore: 88,
          }),
        );
        return;
      }

      if (req.method === 'GET' && req.url === '/v1/regions') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            currentRegion: 'us',
            disclaimer: 'islands',
            regions: [{ code: 'us', name: 'United States', flyRegion: 'iad', residencyLabel: 'US', apiBaseUrl: 'http://x', webBaseUrl: 'http://y' }],
          }),
        );
        return;
      }

      if (req.method === 'GET' && req.url === '/v1/locales') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: [{ code: 'sw', name: 'Swahili' }] }));
        return;
      }

      if (req.method === 'POST' && req.url === '/v1/localize') {
        const raw = await readBody(req);
        const body = JSON.parse(raw) as { content: Record<string, string>; target: string };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            format: 'json',
            content: Object.fromEntries(
              Object.entries(body.content).map(([k, v]) => [k, `[${body.target}] ${v}`]),
            ),
            serialized: '{}',
            strings: 1,
            translated: 1,
            tmHits: 0,
            glossaryApplied: 0,
          }),
        );
        return;
      }

      if (req.method === 'POST' && req.url === '/v1/jobs') {
        const raw = await readBody(req);
        const body = JSON.parse(raw) as { type: string };
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            id: 'job_1',
            type: body.type,
            status: 'queued',
            input: {},
            result: null,
            error: null,
            webhookUrl: null,
            webhookStatus: null,
            attempts: 0,
            createdAt: new Date().toISOString(),
            startedAt: null,
          }),
        );
        return;
      }

      if (req.method === 'GET' && req.url?.startsWith('/v1/jobs')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify(
            req.url === '/v1/jobs/job_1'
              ? {
                  id: 'job_1',
                  type: 'batch_translate',
                  status: 'succeeded',
                  input: {},
                  result: { ok: true },
                  error: null,
                  webhookUrl: null,
                  webhookStatus: null,
                  attempts: 1,
                  createdAt: new Date().toISOString(),
                  startedAt: null,
                }
              : [
                  {
                    id: 'job_1',
                    type: 'batch_translate',
                    status: 'succeeded',
                    input: {},
                    result: null,
                    error: null,
                    webhookUrl: null,
                    webhookStatus: null,
                    attempts: 1,
                    createdAt: new Date().toISOString(),
                    startedAt: null,
                  },
                ],
          ),
        );
        return;
      }

      if (req.method === 'POST' && req.url === '/v1/ocr') {
        await readBody(req);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            text: 'OCR text',
            pages: 1,
            provider: 'fixture_ocr',
            characters: 8,
            translatedText: null,
            translateProvider: null,
            source: null,
            target: null,
          }),
        );
        return;
      }

      if (req.method === 'POST' && req.url === '/v1/audio/speech') {
        const raw = await readBody(req);
        const body = JSON.parse(raw) as { text: string; voice: string };
        const audio = Buffer.from(`AUDIO:${body.voice}:${body.text}`);
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'X-Lugemi-Provider': 'fixture_tts',
          'X-Lugemi-Voice': body.voice,
          'X-Lugemi-Characters': String([...body.text].length),
        });
        res.end(audio);
        return;
      }

      res.writeHead(404).end();
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
    close = () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
  });

  afterAll(async () => {
    await close();
  });

  it('translates via the mock API', async () => {
    const client = new Lugemi({ apiKey: 'lg_live_testkey', baseUrl });
    const result = await client.translate({ text: 'Hello', source: 'en', target: 'sw' });
    expect(result.text).toBe('[sw] Hello');
    expect(result.characters).toBe(5);
    expect(result.provider).toBe('fixture');
  });

  it('detects language via the mock API', async () => {
    const client = new Lugemi({ apiKey: 'lg_live_testkey', baseUrl });
    const result = await client.detect({ text: 'Hello' });
    expect(result.language).toBe('en');
    expect(result.provider).toBe('fixture_detect');
  });

  it('chats via the mock API', async () => {
    const client = new Lugemi({ apiKey: 'lg_live_testkey', baseUrl });
    const result = await client.chat({ messages: [{ role: 'user', content: 'Hi' }] });
    expect(result.choices[0]?.message.content).toBe('Echo: Hi');
  });

  it('creates embeddings via the mock API', async () => {
    const client = new Lugemi({ apiKey: 'lg_live_testkey', baseUrl });
    const result = await client.embeddings({ input: 'Habari' });
    expect(result.data[0]?.embedding).toEqual([6, 0]);
  });

  it('lists languages', async () => {
    const client = new Lugemi({ apiKey: 'lg_live_testkey', baseUrl });
    const languages = await client.languages();
    expect(languages[0]?.code).toBe('en');
  });

  it('lists regions and locales', async () => {
    const client = new Lugemi({ apiKey: 'lg_live_testkey', baseUrl });
    const regions = await client.regions();
    expect(regions.currentRegion).toBe('us');
    const locales = await client.locales();
    expect(locales[0]?.code).toBe('sw');
  });

  it('localizes JSON content', async () => {
    const client = new Lugemi({ apiKey: 'lg_live_testkey', baseUrl });
    const result = await client.localize({
      source: 'en',
      target: 'sw',
      content: { hello: 'Hello' },
    });
    expect(result.content).toEqual({ hello: '[sw] Hello' });
  });

  it('creates and fetches jobs', async () => {
    const client = new Lugemi({ apiKey: 'lg_live_testkey', baseUrl });
    const created = await client.createJob({
      type: 'batch_translate',
      input: { source: 'en', target: 'sw', items: [{ id: '1', text: 'Hi' }] },
    });
    expect(created.id).toBe('job_1');
    const listed = await client.listJobs();
    expect(listed[0]?.id).toBe('job_1');
    const got = await client.getJob('job_1');
    expect(got.status).toBe('succeeded');
  });

  it('runs OCR and speech', async () => {
    const client = new Lugemi({ apiKey: 'lg_live_testkey', baseUrl });
    const ocr = await client.ocr({
      file: { data: new Uint8Array([1, 2, 3]), filename: 'page.png', contentType: 'image/png' },
    });
    expect(ocr.text).toBe('OCR text');
    const speech = await client.speech({ text: 'Hi', voice: 'alloy' });
    expect(Buffer.from(speech.audio).toString('utf8')).toContain('AUDIO:alloy:Hi');
    expect(speech.provider).toBe('fixture_tts');
  });

  it('maps API errors to LugemiError', async () => {
    const client = new Lugemi({ apiKey: 'lg_live_wrong', baseUrl });
    await expect(client.translate({ text: 'Hi', source: 'en', target: 'sw' })).rejects.toBeInstanceOf(
      LugemiError,
    );
  });

  it('rejects non Lugemi keys at construction', () => {
    expect(() => new Lugemi({ apiKey: 'sk_test' })).toThrow(/lg_live_|lg_test_/);
  });

  it('accepts lg_test_ soft-sandbox keys at construction', () => {
    expect(() => new Lugemi({ apiKey: 'lg_test_abc', baseUrl: 'http://127.0.0.1' })).not.toThrow();
  });

  it('accepts legacy vl_live_ / vl_test_ keys at construction', () => {
    expect(() => new Lugemi({ apiKey: 'vl_live_legacy', baseUrl: 'http://127.0.0.1' })).not.toThrow();
    expect(() => new Lugemi({ apiKey: 'vl_test_legacy', baseUrl: 'http://127.0.0.1' })).not.toThrow();
  });
});
