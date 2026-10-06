import { readFileSync, existsSync } from 'fs';
import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { normalizeForEval } from '../eval/metrics';
import {
  TranslateInput,
  TranslateOutput,
  TranslationProvider,
} from '../gateway/translation-provider';
import type { FineTuneArtifactKind, ReadyFineTuneRoute } from './finetune.types';

type PhraseMapFile = {
  sourceLang: string;
  targetLang: string;
  entries: Array<{ source: string; target: string }>;
};

/**
 * Serves a promoted fine-tune artifact for a language pair.
 * - phrase_map: local JSON of source→target (CI / manual attach)
 * - http_endpoint: POST JSON to a rented inference URL
 */
export class FineTuneTranslateAdapter implements TranslationProvider {
  readonly name = 'finetune';

  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async translate(
    input: TranslateInput,
    route?: ReadyFineTuneRoute,
  ): Promise<TranslateOutput> {
    if (!route) {
      throw new ApiException(
        'provider_not_configured',
        'No fine-tune route for this language pair',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const started = Date.now;
    const text =
      route.artifactKind === 'phrase_map'
        ? this.translatePhraseMap(input, route.artifactUri)
        : await this.translateHttp(input, route.artifactUri);

    return {
      text,
      source: input.source,
      target: input.target,
      provider: this.name,
      characters: [...input.text].length,
      latencyMs: Date.now - started,
    };
  }

  private translatePhraseMap(input: TranslateInput, uri: string): string {
    if (!existsSync(uri)) {
      throw new ApiException(
        'provider_not_configured',
        `Fine-tune phrase map missing: ${uri}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const file = JSON.parse(readFileSync(uri, 'utf8')) as PhraseMapFile;
    const needle = normalizeForEval(input.text);
    const hit = file.entries.find((e) => normalizeForEval(e.source) === needle);
    if (!hit) {
      throw new ApiException(
        'provider_error',
        'Fine-tune phrase map miss; falling back to default provider',
        HttpStatus.BAD_GATEWAY,
      );
    }
    return hit.target;
  }

  private async translateHttp(input: TranslateInput, uri: string): Promise<string> {
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      throw new ApiException(
        'provider_not_configured',
        'Fine-tune http_endpoint artifactUri must be an absolute URL',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const response = await this.fetchImpl(uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: input.text,
        source: input.source,
        target: input.target,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new ApiException(
        'provider_unavailable',
        `Fine-tune endpoint HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const json = (await response.json) as { text?: string; translatedText?: string };
    const text = json.text ?? json.translatedText;
    if (!text) {
      throw new ApiException(
        'provider_error',
        'Fine-tune endpoint returned empty text',
        HttpStatus.BAD_GATEWAY,
      );
    }
    return text;
  }
}

export function assertArtifactKind(kind: string): FineTuneArtifactKind {
  if (kind === 'phrase_map' || kind === 'http_endpoint') return kind;
  throw new ApiException(
    'validation_error',
    'artifactKind must be phrase_map or http_endpoint',
    HttpStatus.BAD_REQUEST,
  );
}
