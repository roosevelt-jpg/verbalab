import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('support message', () => {
  it('requires email and message', async () => {
    const res = await POST(
      new Request('http://localhost/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('files a ticket for a valid message', async () => {
    const res = await POST(
      new Request('http://localhost/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'builder@example.com',
          subject: '401 on translate',
          category: 'api-integration',
          message: 'Playground returns 401 after applying lg_test_ key.',
        }),
      }),
    );
    const body = (await res.json()) as { ok: boolean; ticketId: string };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.ticketId).toMatch(/^sup_/);
  });
});
