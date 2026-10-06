import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { TtsInput, TtsOutput, TtsProvider, TtsVoice } from './tts-provider';

/**
 * Intended production Lugemi Pulse catalog (`own:*`) via OWN_TTS_URL.
 * Region / ethnic labels are cultural metadata for pickers — not a claim of
 * perfect native-speaker acoustic cloning for every community.
 */
export const OWN_TTS_VOICES: TtsVoice[] = [
  { id: 'own:sw-aisha', name: 'Aisha (Swahili)', gender: 'female', languages: ['sw', 'en'], provider: 'own_tts' },
  { id: 'own:sw-ke-female', name: 'Aisha · Nairobi', gender: 'female', languages: ['sw', 'en'], provider: 'own_tts' },
  { id: 'own:yo-tunde', name: 'Tunde (Yoruba)', gender: 'male', languages: ['yo', 'en'], provider: 'own_tts' },
  { id: 'own:yo-ng-male', name: 'Tunde · Lagos', gender: 'male', languages: ['yo', 'en'], provider: 'own_tts' },
  { id: 'own:am-hanna', name: 'Hanna (Amharic)', gender: 'female', languages: ['am', 'en'], provider: 'own_tts' },
  { id: 'own:am-et-female', name: 'Hanna · Addis', gender: 'female', languages: ['am', 'en'], provider: 'own_tts' },
  { id: 'own:en-kofi', name: 'Kofi (EN-Africa)', gender: 'male', languages: ['en'], provider: 'own_tts' },
  { id: 'own:zu-za-female', name: 'Thandi · Durban', gender: 'female', languages: ['zu', 'en'], provider: 'own_tts' },
  { id: 'own:ar-eg-male', name: 'Omar · Cairo', gender: 'male', languages: ['ar', 'en'], provider: 'own_tts' },
  { id: 'own:fr-sn-female', name: 'Awa · Dakar', gender: 'female', languages: ['fr', 'wo', 'en'], provider: 'own_tts' },
  { id: 'own:ha-ng-male', name: 'Sani · Kano', gender: 'male', languages: ['ha', 'en'], provider: 'own_tts' },
  { id: 'own:ak-gh-female', name: 'Akosua · Accra', gender: 'female', languages: ['ak', 'en'], provider: 'own_tts' },
  { id: 'own:ig-ng-female', name: 'Ada · Enugu', gender: 'female', languages: ['ig', 'en'], provider: 'own_tts' },
  { id: 'own:so-so-male', name: 'Abdi · Mogadishu', gender: 'male', languages: ['so', 'en'], provider: 'own_tts' },
  { id: 'own:wo-sn-male', name: 'Moussa · Dakar', gender: 'male', languages: ['wo', 'fr', 'en'], provider: 'own_tts' },
  { id: 'own:lg-ug-female', name: 'Nakato · Kampala', gender: 'female', languages: ['lg', 'en'], provider: 'own_tts' },
  { id: 'own:ln-cd-male', name: 'Jean · Kinshasa', gender: 'male', languages: ['ln', 'fr', 'en'], provider: 'own_tts' },
  { id: 'own:om-et-female', name: 'Chaltu · Adama', gender: 'female', languages: ['om', 'en'], provider: 'own_tts' },
  { id: 'own:rw-rw-female', name: 'Uwase · Kigali', gender: 'female', languages: ['rw', 'en'], provider: 'own_tts' },
  { id: 'own:xh-za-male', name: 'Lunga · Cape Town', gender: 'male', languages: ['xh', 'en'], provider: 'own_tts' },
  { id: 'own:pcm-ng-female', name: 'Blessing · Lagos', gender: 'female', languages: ['pcm', 'en'], provider: 'own_tts' },
  { id: 'own:bm-ml-male', name: 'Sékou · Bamako', gender: 'male', languages: ['bm', 'fr', 'en'], provider: 'own_tts' },
  { id: 'own:ee-gh-female', name: 'Ama · Ho', gender: 'female', languages: ['ee', 'en'], provider: 'own_tts' },
  { id: 'own:ti-et-male', name: 'Yonas · Mekelle', gender: 'male', languages: ['ti', 'en'], provider: 'own_tts' },
  { id: 'own:sn-zw-female', name: 'Rudo · Harare', gender: 'female', languages: ['sn', 'en'], provider: 'own_tts' },
  { id: 'own:ny-mw-male', name: 'Chisomo · Lilongwe', gender: 'male', languages: ['ny', 'en'], provider: 'own_tts' },
  { id: 'own:ff-sn-female', name: 'Aissatou · Saint-Louis', gender: 'female', languages: ['ff', 'fr', 'en'], provider: 'own_tts' },
  { id: 'own:pt-ao-male', name: 'Nzinga · Luanda', gender: 'male', languages: ['pt', 'en'], provider: 'own_tts' },
  { id: 'own:af-za-female', name: 'Annelie · Cape Town', gender: 'female', languages: ['af', 'en'], provider: 'own_tts' },
  { id: 'own:tn-bw-male', name: 'Kagiso · Gaborone', gender: 'male', languages: ['tn', 'en'], provider: 'own_tts' },
];

/** Map region-aware CMS ids to synthesis keys sent to OWN_TTS_URL backends. */
const OWN_TTS_SYNTH_KEY: Record<string, string> = {
  'own:sw-ke-female': 'sw-aisha',
  'own:sw-aisha': 'sw-aisha',
  'own:yo-ng-male': 'yo-tunde',
  'own:yo-tunde': 'yo-tunde',
  'own:am-et-female': 'am-hanna',
  'own:am-hanna': 'am-hanna',
  'own:en-kofi': 'en-kofi',
  'own:zu-za-female': 'zu-za-female',
  'own:ar-eg-male': 'ar-eg-male',
  'own:fr-sn-female': 'fr-sn-female',
  'own:ha-ng-male': 'ha-ng-male',
  'own:ak-gh-female': 'ak-gh-female',
  'own:ig-ng-female': 'ig-ng-female', 'own:so-so-male': 'so-so-male', 'own:wo-sn-male': 'wo-sn-male',
  'own:lg-ug-female': 'lg-ug-female', 'own:ln-cd-male': 'ln-cd-male', 'own:om-et-female': 'om-et-female',
  'own:rw-rw-female': 'rw-rw-female', 'own:xh-za-male': 'xh-za-male', 'own:pcm-ng-female': 'pcm-ng-female',
  'own:bm-ml-male': 'bm-ml-male', 'own:ee-gh-female': 'ee-gh-female', 'own:ti-et-male': 'ti-et-male',
  'own:sn-zw-female': 'sn-zw-female', 'own:ny-mw-male': 'ny-mw-male', 'own:ff-sn-female': 'ff-sn-female',
  'own:pt-ao-male': 'pt-ao-male', 'own:af-za-female': 'af-za-female', 'own:tn-bw-male': 'tn-bw-male',
};

const MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  opus: 'audio/opus',
  aac: 'audio/aac',
  flac: 'audio/flac',
};

export function isOwnTtsVoice(voice: string): boolean {
  return voice.startsWith('own:');
}

export function ownTtsConfigured(): boolean {
  return Boolean(process.env.OWN_TTS_URL?.trim()) || process.env.OWN_TTS_FIXTURE === '1';
}

export function resolveOwnTtsVoice(voice: string): TtsVoice | undefined {
  return OWN_TTS_VOICES.find((v) => v.id === voice);
}

/** Minimal RIFF/WAV for fixture playback without claiming a real GPU run. */
function tinyWav(seed: string): Buffer {
  const dataSize = 64;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(8000, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < dataSize; i++) {
    buffer[44 + i] = (seed.charCodeAt(i % seed.length) + i) % 256;
  }
  return buffer;
}

export class FixtureOwnTtsAdapter implements TtsProvider {
  readonly name = 'own_tts_fixture';

  listVoices(): TtsVoice[] {
    return OWN_TTS_VOICES.map((v) => ({ ...v, provider: this.name }));
  }

  async synthesize(input: TtsInput): Promise<TtsOutput> {
    const voice = resolveOwnTtsVoice(input.voice);
    if (!voice) {
      throw new ApiException(
        'validation_error',
        `Unknown own TTS voice "${input.voice}"`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const format = input.format === 'wav' ? 'wav' : 'wav';
    const started = Date.now();
    return {
      audio: tinyWav(`${input.voice}:${input.text}`),
      mimeType: 'audio/wav',
      format,
      voice: input.voice,
      characters: [...input.text].length,
      provider: this.name,
      latencyMs: Date.now() - started,
    };
  }
}

/**
 * HTTP client for a rented GPU TTS endpoint (Modal/vLLM/XTTS/etc.).
 * Contract: POST JSON { text, voice, language?, format? } → audio bytes or { audioBase64, mimeType? }.
 */
export class HttpOwnTtsAdapter implements TtsProvider {
  readonly name = 'own_tts';

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  listVoices(): TtsVoice[] {
    return OWN_TTS_VOICES;
  }

  async synthesize(input: TtsInput): Promise<TtsOutput> {
    if (!this.baseUrl) {
      throw new ApiException(
        'provider_not_configured',
        'OWN_TTS_URL is not set. Deploy an open-weight TTS endpoint (e.g. Modal) or set OWN_TTS_FIXTURE=1 for tests.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const voice = resolveOwnTtsVoice(input.voice);
    if (!voice) {
      throw new ApiException(
        'validation_error',
        `Unknown own TTS voice "${input.voice}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const format = input.format ?? 'mp3';
    if (!MIME[format]) {
      throw new ApiException('validation_error', `Unsupported format: ${format}`, HttpStatus.BAD_REQUEST);
    }

    const started = Date.now();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'audio/*, application/json',
    };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    const synthKey = OWN_TTS_SYNTH_KEY[input.voice] ?? input.voice.replace(/^own:/, '');

    let response: Response;
    try {
      response = await fetch(this.baseUrl.replace(/\/$/, ''), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: input.text,
          voice: synthKey,
          language: input.language,
          format,
        }),
        signal: AbortSignal.timeout(Number(process.env.TTS_TIMEOUT_MS ?? 60_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'Own TTS request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ApiException(
        'provider_error',
        `Own TTS HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = (await response.json()) as { audioBase64?: string; mimeType?: string };
      if (!body.audioBase64) {
        throw new ApiException(
          'provider_error',
          'Own TTS JSON response missing audioBase64',
          HttpStatus.BAD_GATEWAY,
        );
      }
      return {
        audio: Buffer.from(body.audioBase64, 'base64'),
        mimeType: body.mimeType ?? MIME[format]!,
        format,
        voice: input.voice,
        characters: [...input.text].length,
        provider: this.name,
        latencyMs: Date.now() - started,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      audio: Buffer.from(arrayBuffer),
      mimeType: contentType.split(';')[0]?.trim() || MIME[format]!,
      format,
      voice: input.voice,
      characters: [...input.text].length,
      provider: this.name,
      latencyMs: Date.now() - started,
    };
  }
}

/** Lists catalog but refuses synthesis until OWN_TTS_URL or fixture is set. */
export class UnconfiguredOwnTtsAdapter implements TtsProvider {
  readonly name = 'own_tts';

  listVoices(): TtsVoice[] {
    return OWN_TTS_VOICES;
  }

  async synthesize(_input: TtsInput): Promise<TtsOutput> {
    throw new ApiException(
      'provider_not_configured',
      'OWN_TTS_URL is not set. Deploy an open-weight TTS endpoint (e.g. on Modal), or set OWN_TTS_FIXTURE=1 for local/CI fixtures.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export function createOwnTtsAdapter(): TtsProvider {
  if (process.env.OWN_TTS_FIXTURE === '1') {
    return new FixtureOwnTtsAdapter();
  }
  const url = process.env.OWN_TTS_URL?.trim() ?? '';
  if (url) {
    return new HttpOwnTtsAdapter(url, process.env.OWN_TTS_API_KEY?.trim() || undefined);
  }
  return new UnconfiguredOwnTtsAdapter();
}
