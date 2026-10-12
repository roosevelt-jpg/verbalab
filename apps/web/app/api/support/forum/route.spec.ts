import { describe, expect, it } from 'vitest';
import { GET, POST } from './route';

describe('support forum', () => {
  it('lists seeded threads', async () => {
    const res = await GET(new Request('http://localhost/api/support/forum'));
    const body = (await res.json()) as { threads: Array<{ id: string; title: string }> };
    expect(res.status).toBe(200);
    expect(body.threads.length).toBeGreaterThan(0);
    expect(body.threads.some((t) => /401|Kiswahili|429|OpenAPI/i.test(t.title))).toBe(true);
  });

  it('creates a thread', async () => {
    const res = await POST(
      new Request('http://localhost/api/support/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Webhook retries for document jobs',
          body: 'What status codes should my webhook return so Lugemi stops retrying?',
          author: 'Test builder',
          category: 'api-integration',
        }),
      }),
    );
    const body = (await res.json()) as { ok: boolean; thread: { id: string; title: string } };
    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.thread.id).toMatch(/^frm_/);
    expect(body.thread.title).toMatch(/Webhook/);
  });
});
