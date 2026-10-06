import { describe, expect, it, vi } from 'vitest';
import { GoogleTranslateAdapter } from '../src/gateway/google-translate.adapter';
import { ApiException } from '../src/common/errors/api-exception';

describe('GoogleTranslateAdapter',  => {
  it('returns translated text from a fixture response', async  => {
    const fetchImpl = vi.fn.mockResolvedValue({
      ok: true,
      status: 200,
      json: async  => ({
        data: { translations: [{ translatedText: 'Habari' }] },
      }),
    });

    const adapter = new GoogleTranslateAdapter('test-key', fetchImpl as unknown as typeof fetch);
    const result = await adapter.translate({ text: 'Hello', source: 'en', target: 'sw' });

    expect(result.text).toBe('Habari');
    expect(result.provider).toBe('google_translate');
    expect(result.characters).toBe(5);
    expect(fetchImpl).toHaveBeenCalledOnce;
  });

  it('throws provider_not_configured when API key is missing', async  => {
    const adapter = new GoogleTranslateAdapter('');
    await expect(
      adapter.translate({ text: 'Hello', source: 'en', target: 'sw' }),
    ).rejects.toMatchObject({ code: 'provider_not_configured' } satisfies Partial<ApiException>);
  });

  it('retries once on HTTP 503 then succeeds', async  => {
    const fetchImpl = vi
      .fn
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async  => ({ error: { message: 'unavailable' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async  => ({
          data: { translations: [{ translatedText: 'Habari' }] },
        }),
      });

    const adapter = new GoogleTranslateAdapter('test-key', fetchImpl as unknown as typeof fetch);
    const result = await adapter.translate({ text: 'Hello', source: 'en', target: 'sw' });
    expect(result.text).toBe('Habari');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
