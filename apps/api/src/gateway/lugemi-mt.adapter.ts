import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import {
  TranslateInput,
  TranslateOutput,
  TranslationProvider,
} from './translation-provider';
import { lugemiLocalTranslate } from './lugemi-mt.engine';

type RemoteMtResponse = {
  text?: string;
  translatedText?: string;
  source?: string;
  target?: string;
  error?: { message?: string };
};

/**
 * Lugemi Baobab MT — first-party default.
 * Order: LUGEMI_MT_URL (remote Lugemi) → local Baobab engine.
 * Vendor adapters are never branded here; Gateway may chain them silently.
 */
export class LugemiMtAdapter implements TranslationProvider {
  readonly name = 'lugemi_baobab';

  constructor(
    private readonly remoteUrl: string,
    private readonly apiKey?: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async translate(input: TranslateInput): Promise<TranslateOutput> {
    const started = Date.now();
    if (this.remoteUrl) {
      try {
        return await this.remoteTranslate(input, started);
      } catch {
        // Fall through to local Baobab engine — keep default path first-party.
      }
    }
    return {
      text: lugemiLocalTranslate(input.text, input.source, input.target),
      source: input.source === 'auto' ? input.source : input.source,
      target: input.target,
      provider: this.name,
      characters: [...input.text].length,
      latencyMs: Date.now() - started,
    };
  }

  private async remoteTranslate(input: TranslateInput, started: number): Promise<TranslateOutput> {
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
        body: JSON.stringify({
          text: input.text,
          source: input.source,
          target: input.target,
          model: 'lugemi-baobab-mt-v1',
        }),
        signal: AbortSignal.timeout(Number(process.env.MT_TIMEOUT_MS ?? 15_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'Lugemi MT request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const json = (await response.json().catch(() => ({}))) as RemoteMtResponse;
    if (!response.ok) {
      throw new ApiException(
        'provider_error',
        json.error?.message ?? `Lugemi MT HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const text = json.text ?? json.translatedText;
    if (!text) {
      throw new ApiException(
        'provider_error',
        'Lugemi MT returned empty translation',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return {
      text,
      source: json.source ?? input.source,
      target: json.target ?? input.target,
      provider: this.name,
      characters: [...input.text].length,
      latencyMs: Date.now() - started,
    };
  }
}

export function createLugemiMtAdapter(fetchImpl?: typeof fetch): TranslationProvider {
  return new LugemiMtAdapter(
    process.env.LUGEMI_MT_URL?.trim() ?? '',
    process.env.LUGEMI_MT_API_KEY?.trim() || undefined,
    fetchImpl,
  );
}
