import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { EmbedInput, EmbedOutput, EmbeddingProvider } from './embedding-provider';

const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';

type OpenAiEmbeddingsResponse = {
  model?: string;
  data?: Array<{ index?: number; embedding?: number[] }>;
  usage?: { prompt_tokens?: number; total_tokens?: number };
  error?: { message?: string };
};

export class OpenAiEmbeddingsAdapter implements EmbeddingProvider {
  readonly name = 'openai_embeddings';

  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async embed(input: EmbedInput): Promise<EmbedOutput> {
    if (!this.apiKey) {
      throw new ApiException(
        'provider_not_configured',
        'OPENAI_API_KEY is not set',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const model = input.model ?? process.env.OPENAI_EMBEDDINGS_MODEL ?? 'text-embedding-3-small';
    const started = Date.now;

    let response: Response;
    try {
      response = await this.fetchImpl(OPENAI_EMBEDDINGS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: input.input,
        }),
        signal: AbortSignal.timeout(Number(process.env.EMBEDDINGS_TIMEOUT_MS ?? 30_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'Embeddings request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const json = (await response.json.catch( => ({}))) as OpenAiEmbeddingsResponse;
    if (!response.ok) {
      throw new ApiException(
        'provider_error',
        json.error?.message ?? `OpenAI Embeddings HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const data = (json.data ?? [])
      .filter((item) => Array.isArray(item.embedding))
      .map((item) => ({
        index: item.index ?? 0,
        embedding: item.embedding as number[],
      }))
      .sort((a, b) => a.index - b.index);

    if (data.length === 0) {
      throw new ApiException(
        'provider_error',
        'OpenAI Embeddings returned no vectors',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return {
      data,
      model: json.model ?? model,
      provider: this.name,
      promptTokens: json.usage?.prompt_tokens ?? 0,
      totalTokens: json.usage?.total_tokens ?? json.usage?.prompt_tokens ?? 0,
      latencyMs: Date.now - started,
    };
  }
}
