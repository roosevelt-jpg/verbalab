import { describe, expect, it, vi } from 'vitest';
import { OpenAiChatAdapter } from '../src/gateway/openai-chat.adapter';
import { ApiException } from '../src/common/errors/api-exception';

describe('OpenAiChatAdapter',  => {
  it('parses OpenAI chat completion response', async  => {
    const fetchImpl = vi.fn.mockResolvedValue({
      ok: true,
      status: 200,
      json: async  => ({
        model: 'gpt-4o-mini',
        choices: [{ message: { role: 'assistant', content: 'Habari means hello.' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    });

    const adapter = new OpenAiChatAdapter('test-key', fetchImpl as unknown as typeof fetch);
    const result = await adapter.complete({
      messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'What does Habari mean?' },
      ],
    });

    expect(result.message.content).toBe('Habari means hello.');
    expect(result.provider).toBe('openai_chat');
    expect(result.totalTokens).toBe(15);
    expect(fetchImpl).toHaveBeenCalledOnce;
  });

  it('throws when API key is missing', async  => {
    const adapter = new OpenAiChatAdapter('');
    await expect(
      adapter.complete({ messages: [{ role: 'user', content: 'Hi' }] }),
    ).rejects.toMatchObject({ code: 'provider_not_configured' } satisfies Partial<ApiException>);
  });
});
