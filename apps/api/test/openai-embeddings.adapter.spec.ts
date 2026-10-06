import { describe, expect, it, vi } from 'vitest';
import { OpenAiEmbeddingsAdapter } from '../src/gateway/openai-embeddings.adapter';
import { ApiException } from '../src/common/errors/api-exception';

describe('OpenAiEmbeddingsAdapter', () => {
  it('parses OpenAI embeddings response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        model: 'text-embedding-3-small',
        data: [{ index: 0, embedding: [0.1, 0.2, 0.3] }],
        usage: { prompt_tokens: 4, total_tokens: 4 },
      }),
    });

    const adapter = new OpenAiEmbeddingsAdapter('test-key', fetchImpl as unknown as typeof fetch);
    const result = await adapter.embed({ input: 'Hello' });
    expect(result.data[0]?.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(result.provider).toBe('openai_embeddings');
    expect(result.totalTokens).toBe(4);
  });

  it('throws when API key is missing', async () => {
    const adapter = new OpenAiEmbeddingsAdapter('');
    await expect(adapter.embed({ input: 'Hi' })).rejects.toMatchObject({
      code: 'provider_not_configured',
    } satisfies Partial<ApiException>);
  });
});
