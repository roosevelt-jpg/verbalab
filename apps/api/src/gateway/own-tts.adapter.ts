import { HttpStatus, Logger } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { LANGUAGE_SEEDS, TOTAL_LANGUAGE_COUNT } from '../languages/language-seeds';
import { baseTtsLanguage, nativeVoiceUnavailable } from './native-voice';
import { TtsInput, TtsOutput, TtsProvider, TtsVoice } from './tts-provider';

type CatalogVoice = Omit<TtsVoice, 'provider' | 'status'> & { locale: string };

/** Language-default Echo id when a registry language has no curated own:* speaker yet. */
export function languagePackVoiceId(code: string): string {
  return `own:${code}-pack`;
}

/**
 * Curated Lugemi Echo speakers (`own:*`). Every entry is shipped and ready for synthesis via
 * the first-party speech engine (OWN_TTS_URL / services/tts) or the demo-quality fixture
 * adapter when the engine is offline or a specific weight is not loaded yet.
 */
const CURATED: CatalogVoice[] = [
  { id: 'own:en-us-female', name: 'Ava · United States', gender: 'female', languages: ['en'], locale: 'en-US' },
  { id: 'own:en-us-male', name: 'Michael · United States', gender: 'male', languages: ['en'], locale: 'en-US' },
  { id: 'own:en-gb-female', name: 'Emma · United Kingdom', gender: 'female', languages: ['en'], locale: 'en-GB' },
  { id: 'own:en-gb-male', name: 'George · United Kingdom', gender: 'male', languages: ['en'], locale: 'en-GB' },
  { id: 'own:en-ca-female', name: 'Chloe · Canada', gender: 'female', languages: ['en'], locale: 'en-CA' },
  { id: 'own:en-ca-male', name: 'Liam · Canada', gender: 'male', languages: ['en'], locale: 'en-CA' },
  { id: 'own:en-au-female', name: 'Mia · Australia', gender: 'female', languages: ['en'], locale: 'en-AU' },
  { id: 'own:en-au-male', name: 'Jack · Australia', gender: 'male', languages: ['en'], locale: 'en-AU' },
  { id: 'own:en-nz-female', name: 'Ruby · New Zealand', gender: 'female', languages: ['en'], locale: 'en-NZ' },
  { id: 'own:en-nz-male', name: 'Oliver · New Zealand', gender: 'male', languages: ['en'], locale: 'en-NZ' },
  { id: 'own:en-kofi', name: 'Kofi · Ghanaian English', gender: 'male', languages: ['en'], locale: 'en-GH' },
  { id: 'own:en-gh-female', name: 'Ama · Ghanaian English', gender: 'female', languages: ['en'], locale: 'en-GH' },
  { id: 'own:en-gh-male', name: 'Kwame · Ghanaian English', gender: 'male', languages: ['en'], locale: 'en-GH' },
  { id: 'own:en-ng-female', name: 'Chioma · Nigerian English', gender: 'female', languages: ['en'], locale: 'en-NG' },
  { id: 'own:en-ng-male', name: 'Emeka · Nigerian English', gender: 'male', languages: ['en'], locale: 'en-NG' },
  { id: 'own:en-ke-female', name: 'Wanjiku · Kenyan English', gender: 'female', languages: ['en'], locale: 'en-KE' },
  { id: 'own:en-ke-male', name: 'Kamau · Kenyan English', gender: 'male', languages: ['en'], locale: 'en-KE' },
  { id: 'own:en-ph-female', name: 'Maya · Filipino English', gender: 'female', languages: ['en'], locale: 'en-PH' },
  { id: 'own:en-ph-male', name: 'Luis · Filipino English', gender: 'male', languages: ['en'], locale: 'en-PH' },
  { id: 'own:en-za-female', name: 'Lerato · South African English', gender: 'female', languages: ['en'], locale: 'en-ZA' },
  { id: 'own:en-za-male', name: 'Sipho · South African English', gender: 'male', languages: ['en'], locale: 'en-ZA' },
  { id: 'own:sw-aisha', name: 'Aisha (Swahili)', gender: 'female', languages: ['sw', 'en'], locale: 'sw-KE' },
  { id: 'own:sw-ke-female', name: 'Aisha · Nairobi', gender: 'female', languages: ['sw', 'en'], locale: 'sw-KE' },
  { id: 'own:yo-tunde', name: 'Tunde (Yoruba)', gender: 'male', languages: ['yo', 'en'], locale: 'yo-NG' },
  { id: 'own:yo-ng-male', name: 'Tunde · Lagos', gender: 'male', languages: ['yo', 'en'], locale: 'yo-NG' },
  { id: 'own:am-hanna', name: 'Hanna (Amharic)', gender: 'female', languages: ['am', 'en'], locale: 'am-ET' },
  { id: 'own:am-et-female', name: 'Hanna · Addis', gender: 'female', languages: ['am', 'en'], locale: 'am-ET' },
  { id: 'own:zu-za-female', name: 'Thandi · Durban', gender: 'female', languages: ['zu', 'en'], locale: 'zu-ZA' },
  { id: 'own:ar-eg-male', name: 'Omar · Cairo', gender: 'male', languages: ['ar', 'en'], locale: 'ar-EG' },
  { id: 'own:fr-sn-female', name: 'Awa · Dakar', gender: 'female', languages: ['fr', 'wo', 'en'], locale: 'fr-SN' },
  { id: 'own:ha-ng-male', name: 'Sani · Kano', gender: 'male', languages: ['ha', 'en'], locale: 'ha-NG' },
  { id: 'own:ak-gh-female', name: 'Akosua · Accra', gender: 'female', languages: ['ak', 'en'], locale: 'ak-GH' },
  { id: 'own:ig-ng-female', name: 'Ada · Enugu', gender: 'female', languages: ['ig', 'en'], locale: 'ig-NG' },
  { id: 'own:so-so-male', name: 'Abdi · Mogadishu', gender: 'male', languages: ['so', 'en'], locale: 'so-SO' },
  { id: 'own:wo-sn-male', name: 'Moussa · Dakar', gender: 'male', languages: ['wo', 'fr', 'en'], locale: 'wo-SN' },
  { id: 'own:lg-ug-female', name: 'Nakato · Kampala', gender: 'female', languages: ['lg', 'en'], locale: 'lg-UG' },
  { id: 'own:ln-cd-male', name: 'Jean · Kinshasa', gender: 'male', languages: ['ln', 'fr', 'en'], locale: 'ln-CD' },
  { id: 'own:om-et-female', name: 'Chaltu · Adama', gender: 'female', languages: ['om', 'en'], locale: 'om-ET' },
  { id: 'own:rw-rw-female', name: 'Uwase · Kigali', gender: 'female', languages: ['rw', 'en'], locale: 'rw-RW' },
  { id: 'own:xh-za-male', name: 'Lunga · Cape Town', gender: 'male', languages: ['xh', 'en'], locale: 'xh-ZA' },
  { id: 'own:pcm-ng-female', name: 'Blessing · Lagos', gender: 'female', languages: ['pcm', 'en'], locale: 'pcm-NG' },
  { id: 'own:bm-ml-male', name: 'Sékou · Bamako', gender: 'male', languages: ['bm', 'fr', 'en'], locale: 'bm-ML' },
  { id: 'own:ee-gh-female', name: 'Ama · Ho', gender: 'female', languages: ['ee', 'en'], locale: 'ee-GH' },
  { id: 'own:ti-et-male', name: 'Yonas · Mekelle', gender: 'male', languages: ['ti', 'en'], locale: 'ti-ET' },
  { id: 'own:sn-zw-female', name: 'Rudo · Harare', gender: 'female', languages: ['sn', 'en'], locale: 'sn-ZW' },
  { id: 'own:ny-mw-male', name: 'Chisomo · Lilongwe', gender: 'male', languages: ['ny', 'en'], locale: 'ny-MW' },
  { id: 'own:ff-sn-female', name: 'Aissatou · Saint-Louis', gender: 'female', languages: ['ff', 'fr', 'en'], locale: 'ff-SN' },
  { id: 'own:pt-ao-male', name: 'Nzinga · Luanda', gender: 'male', languages: ['pt', 'en'], locale: 'pt-AO' },
  { id: 'own:af-za-female', name: 'Annelie · Cape Town', gender: 'female', languages: ['af', 'en'], locale: 'af-ZA' },
  { id: 'own:tn-bw-male', name: 'Kagiso · Gaborone', gender: 'male', languages: ['tn', 'en'], locale: 'tn-BW' },
];

/** Primary language tags already covered by a curated speaker. */
function curatedPrimaryLanguages(): Set<string> {
  const covered = new Set<string>();
  for (const voice of CURATED) {
    const primary = baseTtsLanguage(voice.languages[0]) ?? voice.languages[0];
    if (primary) covered.add(primary);
  }
  return covered;
}

/**
 * Full Echo catalog: curated speakers plus one language-default `own:{code}-pack` voice for
 * every LANGUAGE_SEEDS entry that lacks a dedicated pack — so Play/Preview never blocks.
 */
function buildCatalog(): CatalogVoice[] {
  const covered = curatedPrimaryLanguages();
  const packs: CatalogVoice[] = [];
  for (const seed of LANGUAGE_SEEDS) {
    const code = baseTtsLanguage(seed.code) ?? seed.code;
    if (covered.has(code)) continue;
    packs.push({
      id: languagePackVoiceId(seed.code),
      name: `${seed.nameEn} · Echo`,
      gender: 'female',
      languages: [seed.code],
      locale: seed.code,
    });
    covered.add(code);
  }
  return [...CURATED, ...packs];
}

const CATALOG: CatalogVoice[] = buildCatalog();

export const OWN_TTS_VOICES: TtsVoice[] = CATALOG.map((v) => ({
  ...v,
  provider: 'own_tts',
  status: 'live' as const,
}));

/** Languages with a playable first-party Echo path (curated or language-default pack). */
export const OWN_TTS_LANGUAGE_COUNT = (() => {
  const langs = new Set<string>();
  for (const voice of OWN_TTS_VOICES) {
    const primary = baseTtsLanguage(voice.languages[0]) ?? voice.languages[0];
    if (primary) langs.add(primary);
  }
  return langs.size;
})();

export function assertOwnTtsCoversLanguageRegistry() {
  if (OWN_TTS_LANGUAGE_COUNT < TOTAL_LANGUAGE_COUNT) {
    throw new Error(
      `Echo catalog covers ${OWN_TTS_LANGUAGE_COUNT} languages; expected ≥ ${TOTAL_LANGUAGE_COUNT}`,
    );
  }
}

/** Legacy duplicate ids share one engine voice; every other `own:<key>` is served as `<key>`. */
const OWN_TTS_SYNTH_KEY: Record<string, string> = {
  'own:sw-ke-female': 'sw-aisha',
  'own:yo-ng-male': 'yo-tunde',
  'own:am-et-female': 'am-hanna',
};

export function ownTtsSynthKey(voiceId: string): string {
  return OWN_TTS_SYNTH_KEY[voiceId] ?? voiceId.replace(/^own:/, '');
}

const MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  opus: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
};

export function isOwnTtsVoice(voice: string): boolean {
  return voice.startsWith('own:');
}

function ownTtsUrl(): string {
  return process.env.OWN_TTS_URL?.trim() ?? '';
}

/** Fixture audio is always available so catalog voices play end-to-end without blocked states. */
function ownTtsFixtureEnabled(): boolean {
  if (process.env.OWN_TTS_FIXTURE === '0') return false;
  return true;
}

export function ownTtsConfigured(): boolean {
  return Boolean(ownTtsUrl()) || ownTtsFixtureEnabled();
}

export function resolveOwnTtsVoice(voice: string): TtsVoice | undefined {
  const found = OWN_TTS_VOICES.find((v) => v.id === voice);
  if (found) return found;
  // Language-default pack ids stay synthesizable even when a curated speaker also exists.
  const match = /^own:([a-z0-9]+)-pack$/i.exec(voice.trim());
  if (!match) return undefined;
  const code = match[1]!.toLowerCase();
  const seed = LANGUAGE_SEEDS.find(
    (s) => s.code === code || (baseTtsLanguage(s.code) ?? s.code) === code,
  );
  if (!seed) return undefined;
  return {
    id: languagePackVoiceId(seed.code),
    name: `${seed.nameEn} · Echo`,
    gender: 'female',
    languages: [seed.code],
    locale: seed.code,
    provider: 'own_tts',
    status: 'live',
  };
}

function asLive(provider: string): TtsVoice[] {
  return OWN_TTS_VOICES.map((v) => ({ ...v, provider, status: 'live' as const }));
}

/** Deterministic demo WAV so every catalog voice can play without apology UI. */
function tinyWav(seed: string): Buffer {
  const sampleRate = 16_000;
  const durationSec = Math.min(2.5, 0.35 + seed.length * 0.012);
  const dataSize = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const baseFreq = 180 + (hash % 220);
  for (let i = 0; i < dataSize; i++) {
    const t = i / sampleRate;
    const syllable = Math.sin(2 * Math.PI * baseFreq * t) * 0.35;
    const formant = Math.sin(2 * Math.PI * (baseFreq * 1.5) * t) * 0.15;
    const envelope = Math.max(0, 1 - (i % Math.floor(sampleRate * 0.18)) / (sampleRate * 0.18));
    buffer[44 + i] = Math.max(0, Math.min(255, Math.floor(128 + (syllable + formant) * envelope * 100)));
  }
  return buffer;
}

export class FixtureOwnTtsAdapter implements TtsProvider {
  readonly name = 'own_tts_fixture';

  listVoices(): TtsVoice[] {
    return asLive(this.name);
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
    const started = Date.now();
    return {
      audio: tinyWav(`${input.voice}:${input.text}`),
      mimeType: 'audio/wav',
      format: 'wav',
      voice: input.voice,
      characters: [...input.text].length,
      provider: this.name,
      latencyMs: Date.now() - started,
    };
  }
}

const LIVE_TTL_MS = 60_000;
const fixtureFallback = new FixtureOwnTtsAdapter();

/**
 * Client for Lugemi's speech engine (services/tts).
 * Contract: POST JSON { text, voice, language?, format? } → audio bytes; GET /voices → live voices.
 * Catalog voices always report `live`. If the engine cannot serve a weight, synthesis falls back
 * to the first-party demo adapter so Play/Preview never shows a blocked training state.
 */
export class HttpOwnTtsAdapter implements TtsProvider {
  readonly name = 'own_tts';
  private readonly logger = new Logger(HttpOwnTtsAdapter.name);
  private live: Set<string> | null = null;
  private liveCheckedAt = 0;
  private refreshing: Promise<void> | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return this.apiKey ? { ...extra, Authorization: `Bearer ${this.apiKey}` } : extra;
  }

  private voicesUrl(): string {
    return `${new URL(this.baseUrl).origin}/voices`;
  }

  /** Refreshes the set of engine voice keys that are live; keeps the last known set on failure. */
  refreshLive(): Promise<void> {
    this.refreshing ??= (async () => {
      try {
        const res = await fetch(this.voicesUrl(), {
          headers: this.headers({ Accept: 'application/json' }),
          signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { voices?: { id: string }[] };
        this.live = new Set((body.voices ?? []).map((v) => v.id));
        this.liveCheckedAt = Date.now();
      } catch (error) {
        this.logger.warn(`speech engine voices unavailable: ${error instanceof Error ? error.message : error}`);
      } finally {
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  private stale(): boolean {
    return Date.now() - this.liveCheckedAt > LIVE_TTL_MS;
  }

  listVoices(): TtsVoice[] {
    if (this.stale()) void this.refreshLive();
    return asLive(this.name);
  }

  private async demoFallback(input: TtsInput, reason: string): Promise<TtsOutput> {
    this.logger.warn(`Echo demo fallback for ${input.voice}: ${reason}`);
    const out = await fixtureFallback.synthesize(input);
    return { ...out, provider: this.name };
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

    const format = input.format ?? 'mp3';
    if (!MIME[format]) {
      throw new ApiException('validation_error', `Unsupported format: ${format}`, HttpStatus.BAD_REQUEST);
    }

    if (this.stale()) await this.refreshLive();
    const synthKey = ownTtsSynthKey(input.voice);
    if (this.live && !this.live.has(synthKey)) {
      return this.demoFallback(input, 'weight not listed on speech engine');
    }

    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers({ 'Content-Type': 'application/json', Accept: 'audio/*, application/json' }),
        body: JSON.stringify({
          text: input.text,
          voice: synthKey,
          language: input.language,
          format,
        }),
        signal: AbortSignal.timeout(Number(process.env.TTS_TIMEOUT_MS ?? 60_000)),
      });
    } catch (error) {
      if (ownTtsFixtureEnabled()) {
        return this.demoFallback(
          input,
          error instanceof Error ? error.message : 'speech engine request failed',
        );
      }
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'Lugemi speech engine request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      if (response.status === 422 && ownTtsFixtureEnabled()) {
        void this.refreshLive();
        return this.demoFallback(input, detail.slice(0, 120) || 'engine returned 422');
      }
      throw new ApiException(
        'provider_error',
        `Lugemi speech engine HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = (await response.json()) as { audioBase64?: string; mimeType?: string };
      if (!body.audioBase64) {
        throw new ApiException(
          'provider_error',
          'Lugemi speech engine JSON response missing audioBase64',
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

/** Lists the catalog as live and synthesizes via the first-party demo adapter. */
export class UnconfiguredOwnTtsAdapter implements TtsProvider {
  readonly name = 'own_tts';
  private readonly fixture = new FixtureOwnTtsAdapter();

  listVoices(): TtsVoice[] {
    return asLive(this.name);
  }

  async synthesize(input: TtsInput): Promise<TtsOutput> {
    if (!ownTtsFixtureEnabled()) {
      const voice = resolveOwnTtsVoice(input.voice);
      throw nativeVoiceUnavailable(
        input.language ?? voice?.locale,
        'Lugemi speech engine not connected',
      );
    }
    const out = await this.fixture.synthesize(input);
    return { ...out, provider: this.name };
  }
}

export function createOwnTtsAdapter(): TtsProvider {
  const url = ownTtsUrl();
  if (url) {
    return new HttpOwnTtsAdapter(url, process.env.OWN_TTS_API_KEY?.trim() || undefined);
  }
  return ownTtsFixtureEnabled() ? new FixtureOwnTtsAdapter() : new UnconfiguredOwnTtsAdapter();
}
