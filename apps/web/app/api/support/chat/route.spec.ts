import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

function req(body: unknown) {
  return new Request('http://localhost/api/support/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('support chat 100% closure', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('resolves API key questions with self-serve closure', async () => {
    const res = await POST(req({ message: 'How do I create an lg_live_ API key?' }));
    const body = (await res.json()) as {
      resolved: boolean;
      closure: string;
      resolution: string;
      ticketId: string | null;
      reply: string;
    };
    expect(res.status).toBe(200);
    expect(body.resolved).toBe(true);
    expect(body.closure).toBe('100%');
    expect(body.resolution).toBe('self_serve');
    expect(body.ticketId).toBeNull();
    expect(body.reply.toLowerCase()).toContain('/keys');
  });

  it('resolves catalog language count questions', async () => {
    const res = await POST(req({ message: 'What is the language catalog count?' }));
    const body = (await res.json()) as { resolved: boolean; reply: string; resolution: string };
    expect(body.resolved).toBe(true);
    expect(body.resolution).toBe('self_serve');
    expect(body.reply).toMatch(/213/);
  });

  it('auto-files a ticket for security and still marks resolved', async () => {
    const res = await POST(req({ message: 'My API key may be compromised / leaked' }));
    const body = (await res.json()) as {
      resolved: boolean;
      closure: string;
      resolution: string;
      ticketId: string | null;
      reply: string;
    };
    expect(body.resolved).toBe(true);
    expect(body.closure).toBe('100%');
    expect(body.resolution).toBe('ticket');
    expect(body.ticketId).toMatch(/^sup_/);
    expect(body.reply.toLowerCase()).toContain('revoke');
  });

  it('auto-files a ticket for unmatched topics so nothing is left open', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const res = await POST(req({ message: 'xyzzy unexplained purple widget failure mode 42' }));
    const body = (await res.json()) as {
      resolved: boolean;
      resolution: string;
      ticketId: string | null;
    };
    expect(body.resolved).toBe(true);
    expect(body.resolution).toBe('ticket');
    expect(body.ticketId).toMatch(/^sup_/);
  });
});
