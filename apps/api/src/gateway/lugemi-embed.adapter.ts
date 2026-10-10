import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import {
  EmbedInput,
  EmbedOutput,
  EmbeddingItem,
  EmbeddingProvider,
} from './embedding-provider';

const DEFAULT_MODEL = 'lugemi-vector-embed-v1';
const DIM = 384;

/** Deterministic local Vector embeddings — no third-party keys required. */
export function lugemiLocalEmbed(texts: string[], model: string): EmbedOutput {
  const started = Date.now();
  const data: EmbeddingItem[] = texts.map((text, index) => ({
    index,
    embedding: hashEmbed(text, DIM),
  }));
  const promptTokens = texts.reduce((n, t) => n + Math.max(1, Math.ceil(t.length / 4)), 0);
  return {
    data,
    model,
    provider: 'lugemi_vector',
    promptTokens,
    totalTokens: promptTokens,
    latencyMs: Date.now() - started,
  };
}

function hashEmbed(text: string, dim: number): number[] {
  const out = new Array<number>(dim).fill(0);
  const normalized = text.normalize('NFKC');
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    const slot = (code * (i + 1) * 2654435761) >>> 0;
    out[slot % dim]! += ((code % 97) - 48) / 97;
    out[(slot * 7) % dim]! += Math.sin(code + i) * 0.05;
  }
  let norm = 0;
  for (const v of out) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return out.map((v) => v / norm);
}

/**
 * Lugemi Vector — first-party embeddings default.
 * Prefer LUGEMI_EMBED_URL; else local Vector engine.
 */
export class LugemiEmbedAdapter implements EmbeddingProvider {
  readonly name = 'lugemi_vector';

  constructor(
    private readonly remoteUrl: string,
    private readonly apiKey?: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async embed(input: EmbedInput): Promise<EmbedOutput> {
    const texts = Array.isArray(input.input) ? input.input : [input.input];
    const model = input.model ?? process.env.LUGEMI_EMBED_MODEL?.trim() ?? DEFAULT_MODEL;

    if (this.remoteUrl) {
      try {
        return await this.remoteEmbed(texts, model);
      } catch {
        // Fall through to local Vector.
      }
    }
    return lugemiLocalEmbed(texts, model);
  }

  private async remoteEmbed(texts: string[], model: string): Promise<EmbedOutput> {
    const started = Date.now();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    let response: Response;
    try {
      response = await this.fetchImpl(this.remoteUrl.replace(/\/$/, ''), {
        method: 'POST',
        headers,
        body: JSON.stringify({ input: texts, model }),
        signal: AbortSignal.timeout(Number(process.env.EMBED_TIMEOUT_MS ?? 30_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'Lugemi embed request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const json = (await response.json().catch(() => ({}))) as {
      data?: Array<{ index?: number; embedding?: number[] }>;
      model?: string;
      usage?: { prompt_tokens?: number; total_tokens?: number };
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new ApiException(
        'provider_error',
        json.error?.message ?? `Lugemi embed HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const data = (json.data ?? [])
      .filter((d) => Array.isArray(d.embedding))
      .map((d, i) => ({
        index: d.index ?? i,
        embedding: d.embedding as number[],
      }));

    if (!data.length) {
      throw new ApiException(
        'provider_error',
        'Lugemi embed returned no vectors',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const promptTokens = json.usage?.prompt_tokens ?? texts.reduce((n, t) => n + Math.ceil(t.length / 4), 0);
    return {
      data,
      model: json.model ?? model,
      provider: this.name,
      promptTokens,
      totalTokens: json.usage?.total_tokens ?? promptTokens,
      latencyMs: Date.now() - started,
    };
  }
}

export function createLugemiEmbedAdapter(fetchImpl?: typeof fetch): EmbeddingProvider {
  return new LugemiEmbedAdapter(
    process.env.LUGEMI_EMBED_URL?.trim() ?? '',
    process.env.LUGEMI_EMBED_API_KEY?.trim() || undefined,
    fetchImpl,
  );
}
