import { describe, expect, it, vi } from 'vitest';
import { ResendAdapter } from '../src/notifications/resend.adapter';
import { ApiException } from '../src/common/errors/api-exception';

describe('ResendAdapter',  => {
  it('sends email via Resend fixture response', async  => {
    const fetchImpl = vi.fn.mockResolvedValue({
      ok: true,
      status: 200,
      json: async  => ({ id: 'email_123' }),
    });

    const adapter = new ResendAdapter(
      're_test',
      'Lugemi <noreply@example.com>',
      fetchImpl as unknown as typeof fetch,
    );
    const result = await adapter.send({
      to: 'owner@example.com',
      subject: 'Hello',
      text: 'Body',
    });

    expect(result).toEqual({ id: 'email_123', provider: 'resend' });
    expect(fetchImpl).toHaveBeenCalledOnce;
    const [, init] = fetchImpl.mock.calls[0]!;
    expect(init.headers.Authorization).toBe('Bearer re_test');
    expect(JSON.parse(init.body as string).from).toBe('Lugemi <noreply@example.com>');
  });

  it('throws provider_not_configured when API key is missing', async  => {
    const adapter = new ResendAdapter('', 'Lugemi <noreply@example.com>');
    await expect(
      adapter.send({ to: 'a@b.com', subject: 'x', text: 'y' }),
    ).rejects.toMatchObject({ code: 'provider_not_configured' } satisfies Partial<ApiException>);
  });

  it('throws provider_not_configured when EMAIL_FROM is missing', async  => {
    const adapter = new ResendAdapter('re_test', '');
    await expect(
      adapter.send({ to: 'a@b.com', subject: 'x', text: 'y' }),
    ).rejects.toMatchObject({ code: 'provider_not_configured' } satisfies Partial<ApiException>);
  });
});
