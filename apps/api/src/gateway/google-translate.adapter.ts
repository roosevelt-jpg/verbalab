import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import {
  TranslateInput,
  TranslateOutput,
  TranslationProvider,
} from './translation-provider';

type GoogleTranslateResponse = {
  data?: {
    translations?: Array<{ translatedText: string; detectedSourceLanguage?: string }>;
  };
  error?: { message?: string; code?: number };
};

export class GoogleTranslateAdapter implements TranslationProvider {
  readonly name = 'google_translate';

  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async translate(input: TranslateInput): Promise<TranslateOutput> {
    if (!this.apiKey) {
      throw new ApiException(
        'provider_not_configured',
        'GOOGLE_TRANSLATE_API_KEY is not set. Add the key to enable translation.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const started = Date.now();
    const url = new URL('https://translation.googleapis.com/language/translate/v2');
    url.searchParams.set('key', this.apiKey);

    const body = {
      q: input.text,
      source: input.source,
      target: input.target,
      format: 'text',
    };

    const response = await this.requestWithRetry(url.toString(), body);
    const json = (await response.json()) as GoogleTranslateResponse;

    if (!response.ok) {
      const message = json.error?.message ?? `Google Translate HTTP ${response.status}`;
      if (response.status === 429 || response.status >= 500) {
        throw new ApiException('provider_unavailable', message, HttpStatus.BAD_GATEWAY);
      }
      throw new ApiException('provider_error', message, HttpStatus.BAD_GATEWAY);
    }

    const translated = json.data?.translations?.[0]?.translatedText;
    if (!translated) {
      throw new ApiException(
        'provider_error',
        'Google Translate returned an empty response',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return {
      text: translated,
      source: input.source,
      target: input.target,
      provider: this.name,
      characters: [...input.text].length,
      latencyMs: Date.now() - started,
    };
  }

  private async requestWithRetry(url: string, body: unknown): Promise<Response> {
    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    };

    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await this.fetchImpl(url, init);
        if (attempt === 0 && (response.status === 429 || response.status >= 500)) {
          lastError = new Error(`HTTP ${response.status}`);
          continue;
        }
        return response;
      } catch (error) {
        lastError = error;
        if (attempt === 0) continue;
      }
    }

    throw new ApiException(
      'provider_unavailable',
      lastError instanceof Error ? lastError.message : 'Google Translate request failed',
      HttpStatus.BAD_GATEWAY,
    );
  }
}
