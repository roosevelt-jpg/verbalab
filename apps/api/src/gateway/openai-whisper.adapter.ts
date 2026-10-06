import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { SttInput, SttOutput, SttProvider, SttSegment } from './stt-provider';

const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions';

type WhisperSegment = {
  id?: number;
  start?: number;
  end?: number;
  text?: string;
  avg_logprob?: number;
};

export class OpenAiWhisperAdapter implements SttProvider {
  readonly name = 'openai_whisper';

  constructor(private readonly apiKey: string) {}

  async transcribe(input: SttInput): Promise<SttOutput> {
    if (!this.apiKey) {
      throw new ApiException(
        'provider_not_configured',
        'OPENAI_API_KEY is not set',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const started = Date.now();
    const form = new FormData();
    const blob = new Blob([new Uint8Array(input.buffer)], {
      type: input.mimeType || 'application/octet-stream',
    });
    form.append('file', blob, input.filename);
    form.append('model', process.env.OPENAI_WHISPER_MODEL ?? 'whisper-1');
    form.append('response_format', 'verbose_json');
    if (input.language) {
      form.append('language', input.language);
    }
    if (input.prompt?.trim()) {
      // Whisper uses prompt for style/vocabulary priming (not a hard lexicon).
      form.append('prompt', input.prompt.trim().slice(0, 800));
    }

    let response: Response;
    try {
      response = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: form,
        signal: AbortSignal.timeout(Number(process.env.STT_TIMEOUT_MS ?? 120_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'STT request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ApiException(
        'provider_error',
        `OpenAI Whisper HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const body = (await response.json()) as {
      text?: string;
      language?: string;
      duration?: number;
      segments?: WhisperSegment[];
    };

    const text = typeof body.text === 'string' ? body.text : '';
    const durationSeconds =
      typeof body.duration === 'number' && Number.isFinite(body.duration)
        ? Math.max(0, body.duration)
        : estimateDurationFromBytes(input.buffer.length);

    const segments = mapSegments(body.segments);
    const confidence = aggregateConfidence(segments);

    return {
      text,
      language: body.language ?? input.language,
      durationSeconds,
      provider: this.name,
      latencyMs: Date.now() - started,
      segments: segments.length ? segments : undefined,
      confidence,
    };
  }
}

function mapSegments(raw: WhisperSegment[] | undefined): SttSegment[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((seg, index) => {
    const confidence =
      typeof seg.avg_logprob === 'number' && Number.isFinite(seg.avg_logprob)
        ? logprobToConfidence(seg.avg_logprob)
        : undefined;
    return {
      id: typeof seg.id === 'number' ? seg.id : index,
      start: typeof seg.start === 'number' ? seg.start : 0,
      end: typeof seg.end === 'number' ? seg.end : 0,
      text: typeof seg.text === 'string' ? seg.text.trim() : '',
      confidence,
    };
  });
}

/** Map Whisper avg_logprob (typically -1..0) to a bounded 0–1 confidence. */
export function logprobToConfidence(avgLogprob: number): number {
  const raw = Math.exp(avgLogprob);
  return Math.round(Math.min(1, Math.max(0, raw)) * 1000) / 1000;
}

function aggregateConfidence(segments: SttSegment[]): number | undefined {
  const scores = segments
    .map((s) => s.confidence)
    .filter((c): c is number => typeof c === 'number');
  if (!scores.length) return undefined;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 1000) / 1000;
}

/** Last-resort estimate (~16 kbps speech) when vendor omits duration. */
function estimateDurationFromBytes(bytes: number): number {
  return Math.max(1, Math.round(bytes / 2000));
}
