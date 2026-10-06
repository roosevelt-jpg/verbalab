import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { TtsInput, TtsOutput, TtsProvider, TtsVoice } from './tts-provider';

const OPENAI_SPEECH_URL = 'https://api.openai.com/v1/audio/speech';

const OPENAI_VOICES: TtsVoice[] = [
  { id: 'alloy', name: 'Alloy', gender: 'neutral', languages: ['en'], provider: 'openai_tts' },
  { id: 'echo', name: 'Echo', gender: 'male', languages: ['en'], provider: 'openai_tts' },
  { id: 'fable', name: 'Fable', gender: 'neutral', languages: ['en'], provider: 'openai_tts' },
  { id: 'onyx', name: 'Onyx', gender: 'male', languages: ['en'], provider: 'openai_tts' },
  { id: 'nova', name: 'Nova', gender: 'female', languages: ['en'], provider: 'openai_tts' },
  { id: 'shimmer', name: 'Shimmer', gender: 'female', languages: ['en'], provider: 'openai_tts' },
];

const MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  opus: 'audio/opus',
  aac: 'audio/aac',
  flac: 'audio/flac',
};

export class OpenAiTtsAdapter implements TtsProvider {
  readonly name = 'openai_tts';

  constructor(private readonly apiKey: string) {}

  listVoices: TtsVoice[] {
    return OPENAI_VOICES;
  }

  async synthesize(input: TtsInput): Promise<TtsOutput> {
    if (!this.apiKey) {
      throw new ApiException(
        'provider_not_configured',
        'OPENAI_API_KEY is not set',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const voice = OPENAI_VOICES.find((v) => v.id === input.voice);
    if (!voice) {
      throw new ApiException(
        'validation_error',
        `Unknown voice "${input.voice}". Use GET /v1/audio/voices.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const format = input.format ?? 'mp3';
    if (!MIME[format]) {
      throw new ApiException('validation_error', `Unsupported format: ${format}`, HttpStatus.BAD_REQUEST);
    }

    const started = Date.now;
    let response: Response;
    try {
      response = await fetch(OPENAI_SPEECH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_TTS_MODEL ?? 'tts-1',
          input: input.text,
          voice: input.voice,
          response_format: format,
        }),
        signal: AbortSignal.timeout(Number(process.env.TTS_TIMEOUT_MS ?? 60_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'TTS request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      const detail = await response.text.catch( => '');
      throw new ApiException(
        'provider_error',
        `OpenAI TTS HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const arrayBuffer = await response.arrayBuffer;
    return {
      audio: Buffer.from(arrayBuffer),
      mimeType: MIME[format]!,
      format,
      voice: input.voice,
      characters: [...input.text].length,
      provider: this.name,
      latencyMs: Date.now - started,
    };
  }
}
