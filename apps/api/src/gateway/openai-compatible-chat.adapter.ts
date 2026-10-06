import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { ChatInput, ChatOutput, ChatProvider } from './chat-provider';

type OpenAiCompatibleChatResponse = {
  model?: string;
  choices?: Array<{ message?: { role?: string; content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
};

/**
 * OpenAI Chat Completions–compatible HTTP adapter (OpenAI primary URL or OpenRouter / custom base).
 */
export class OpenAiCompatibleChatAdapter implements ChatProvider {
  constructor(
    readonly name: string,
    private readonly apiKey: string,
    private readonly completionsUrl: string,
    private readonly defaultModel: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly missingKeyMessage = 'Chat provider API key is not set',
  ) {}

  async complete(input: ChatInput): Promise<ChatOutput> {
    if (!this.apiKey) {
      throw new ApiException(
        'provider_not_configured',
        this.missingKeyMessage,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const model = input.model ?? this.defaultModel;
    const started = Date.now();

    let response: Response;
    try {
      response = await this.fetchImpl(this.completionsUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.name === 'openrouter_chat'
            ? {
                'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER ?? 'https://verbalab.ai',
                'X-Title': process.env.OPENROUTER_APP_TITLE ?? 'VerbaLab',
              }
            : {}),
        },
        body: JSON.stringify({
          model,
          messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: 0.4,
        }),
        signal: AbortSignal.timeout(Number(process.env.CHAT_TIMEOUT_MS ?? 60_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'Chat request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const json = (await response.json().catch(() => ({}))) as OpenAiCompatibleChatResponse;
    if (!response.ok) {
      throw new ApiException(
        'provider_error',
        json.error?.message ?? `Chat HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.length === 0) {
      throw new ApiException(
        'provider_error',
        'Chat provider returned empty message',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const promptTokens = json.usage?.prompt_tokens ?? 0;
    const completionTokens = json.usage?.completion_tokens ?? 0;

    return {
      message: { role: 'assistant', content },
      model: json.model ?? model,
      provider: this.name,
      promptTokens,
      completionTokens,
      totalTokens: json.usage?.total_tokens ?? promptTokens + completionTokens,
      latencyMs: Date.now() - started,
    };
  }
}

export function createOpenAiChatAdapter(apiKey: string, fetchImpl?: typeof fetch): ChatProvider {
  return new OpenAiCompatibleChatAdapter(
    'openai_chat',
    apiKey,
    'https://api.openai.com/v1/chat/completions',
    process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
    fetchImpl,
    'OPENAI_API_KEY is not set',
  );
}

export function createOpenRouterChatAdapter(
  apiKey: string,
  fetchImpl?: typeof fetch,
): ChatProvider | null {
  if (!apiKey.trim()) return null;
  const base = (process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '');
  return new OpenAiCompatibleChatAdapter(
    'openrouter_chat',
    apiKey.trim(),
    `${base}/chat/completions`,
    process.env.OPENROUTER_CHAT_MODEL ?? 'openai/gpt-4o-mini',
    fetchImpl,
    'OPENROUTER_API_KEY is not set',
  );
}
