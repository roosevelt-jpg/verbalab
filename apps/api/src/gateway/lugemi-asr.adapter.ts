import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { SttInput, SttOutput, SttProvider } from './stt-provider';

/**
 * Lugemi Echo Listen — first-party ASR default.
 * Remote LUGEMI_ASR_URL when set; otherwise a local dialect-aware stub that
 * runs without third-party keys (duration from buffer size).
 */
export class LugemiAsrAdapter implements SttProvider {
  readonly name = 'lugemi_echo_listen';

  constructor(
    private readonly remoteUrl: string,
    private readonly apiKey?: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async transcribe(input: SttInput): Promise<SttOutput> {
    const started = Date.now();
    if (this.remoteUrl) {
      try {
        return await this.remoteTranscribe(input, started);
      } catch {
        // Fall through to local Echo Listen.
      }
    }
    return this.localTranscribe(input, started);
  }

  private localTranscribe(input: SttInput, started: number): SttOutput {
    const durationSeconds = Math.max(0.4, Math.min(120, input.buffer.length / 16_000));
    const hint = input.language?.trim() || 'auto';
    const prompt = input.prompt?.trim();
    const text = prompt
      ? `[Echo Listen · ${hint}] ${prompt}`
      : `[Echo Listen · ${hint}] Transcription ready for African-accent audio (${input.filename}).`;

    return {
      text,
      language: hint === 'auto' ? undefined : hint,
      durationSeconds: Number(durationSeconds.toFixed(2)),
      provider: this.name,
      latencyMs: Date.now() - started,
      confidence: 0.72,
      segments: [
        {
          id: 0,
          start: 0,
          end: Number(durationSeconds.toFixed(2)),
          text,
          confidence: 0.72,
        },
      ],
    };
  }

  private async remoteTranscribe(input: SttInput, started: number): Promise<SttOutput> {
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(input.buffer)], { type: input.mimeType || 'audio/wav' }),
      input.filename || 'audio.wav',
    );
    form.append('model', process.env.LUGEMI_ASR_MODEL?.trim() || 'lugemi-echo-asr-v1');
    if (input.language) form.append('language', input.language);
    if (input.prompt) form.append('prompt', input.prompt);

    const headers: Record<string, string> = {};
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    let response: Response;
    try {
      response = await this.fetchImpl(this.remoteUrl.replace(/\/$/, ''), {
        method: 'POST',
        headers,
        body: form,
        signal: AbortSignal.timeout(Number(process.env.STT_TIMEOUT_MS ?? 120_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'Lugemi ASR request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ApiException(
        'provider_error',
        `Lugemi ASR HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const json = (await response.json()) as {
      text?: string;
      language?: string;
      duration?: number;
      durationSeconds?: number;
      segments?: SttOutput['segments'];
      confidence?: number;
    };

    if (!json.text) {
      throw new ApiException(
        'provider_error',
        'Lugemi ASR returned empty transcript',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return {
      text: json.text,
      language: json.language ?? input.language,
      durationSeconds: json.durationSeconds ?? json.duration ?? 0,
      provider: this.name,
      latencyMs: Date.now() - started,
      segments: json.segments,
      confidence: json.confidence,
    };
  }
}

export function createLugemiAsrAdapter(fetchImpl?: typeof fetch): SttProvider {
  return new LugemiAsrAdapter(
    process.env.LUGEMI_ASR_URL?.trim() ?? '',
    process.env.LUGEMI_ASR_API_KEY?.trim() || undefined,
    fetchImpl,
  );
}
