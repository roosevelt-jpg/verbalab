import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { OcrInput, OcrOutput, OcrProvider } from './ocr-provider';

type VisionResponse = {
  responses?: Array<{
    fullTextAnnotation?: { text?: string; pages?: unknown[] };
    textAnnotations?: Array<{ description?: string }>;
    error?: { message?: string; code?: number };
  }>;
  error?: { message?: string; code?: number };
};

export class GoogleVisionOcrAdapter implements OcrProvider {
  readonly name = 'google_vision';

  constructor(private readonly apiKey: string) {}

  async extract(input: OcrInput): Promise<OcrOutput> {
    if (!this.apiKey) {
      throw new ApiException(
        'provider_not_configured',
        'GOOGLE_VISION_API_KEY (or GOOGLE_TRANSLATE_API_KEY) is not set',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const mime = input.mimeType.toLowerCase;
    const lower = input.filename.toLowerCase;
    const isImage =
      mime.startsWith('image/') ||
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.gif');

    if (!isImage) {
      throw new ApiException(
        'validation_error',
        'OCR accepts image files (png, jpeg, webp, gif). For digital PDFs use document translate; for scans, upload page images.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const started = Date.now;
    const url = new URL('https://vision.googleapis.com/v1/images:annotate');
    url.searchParams.set('key', this.apiKey);

    const body = {
      requests: [
        {
          image: { content: input.buffer.toString('base64') },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          imageContext: input.languageHints?.length
            ? { languageHints: input.languageHints }
            : undefined,
        },
      ],
    };

    let response: Response;
    try {
      response = await fetch(url.toString, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Number(process.env.OCR_TIMEOUT_MS ?? 60_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'OCR request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const json = (await response.json) as VisionResponse;
    if (!response.ok) {
      const message = json.error?.message ?? `Google Vision HTTP ${response.status}`;
      throw new ApiException('provider_error', message, HttpStatus.BAD_GATEWAY);
    }

    const first = json.responses?.[0];
    if (first?.error?.message) {
      throw new ApiException('provider_error', first.error.message, HttpStatus.BAD_GATEWAY);
    }

    const text =
      first?.fullTextAnnotation?.text?.trim ||
      first?.textAnnotations?.[0]?.description?.trim ||
      '';

    const pages = Math.max(1, first?.fullTextAnnotation?.pages?.length ?? 1);

    return {
      text,
      pages,
      provider: this.name,
      latencyMs: Date.now - started,
    };
  }
}
