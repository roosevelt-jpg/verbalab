import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { DetectInput, DetectOutput, LanguageDetectProvider } from './detect-provider';

type GoogleDetectResponse = {
  data?: {
    detections?: Array<Array<{ language?: string; confidence?: number; isReliable?: boolean }>>;
  };
  error?: { message?: string };
};

export class GoogleDetectAdapter implements LanguageDetectProvider {
  readonly name = 'google_detect';

  constructor(private readonly apiKey: string) {}

  async detect(input: DetectInput): Promise<DetectOutput> {
    if (!this.apiKey) {
      throw new ApiException(
        'provider_not_configured',
        'GOOGLE_TRANSLATE_API_KEY is not set for language detection',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const url = new URL('https://translation.googleapis.com/language/translate/v2/detect');
    url.searchParams.set('key', this.apiKey);

    let response: Response;
    try {
      response = await fetch(url.toString, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: input.text }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'Detect request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const json = (await response.json) as GoogleDetectResponse;
    if (!response.ok) {
      throw new ApiException(
        'provider_error',
        json.error?.message ?? `Google Detect HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const hit = json.data?.detections?.[0]?.[0];
    const language = hit?.language;
    if (!language || language === 'und') {
      throw new ApiException(
        'detection_failed',
        'Could not detect language',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return {
      language,
      confidence: typeof hit.confidence === 'number' ? hit.confidence : 0,
      provider: this.name,
    };
  }
}
