import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import type { TtsVoice } from './tts-provider';

/**
 * Lugemi rule: speech in a language is only produced by a voice built from native
 * speakers of that language. Never substitute a foreign voice (stock English voices,
 * another language's voice, or browser speech) — refuse clearly instead.
 */

const LANGUAGE_ALIASES: Record<string, string> = {
  tw: 'ak',
  twi: 'ak',
  aka: 'ak',
  fat: 'ak',
  fante: 'ak',
  ewe: 'ee',
  hau: 'ha',
  yor: 'yo',
  ibo: 'ig',
  swa: 'sw',
  swh: 'sw',
  zul: 'zu',
  xho: 'xh',
  amh: 'am',
  som: 'so',
  wol: 'wo',
  lug: 'lg',
  lin: 'ln',
  orm: 'om',
  kin: 'rw',
  tir: 'ti',
  sna: 'sn',
  nya: 'ny',
  ful: 'ff',
  bam: 'bm',
  afr: 'af',
  tsn: 'tn',
  ara: 'ar',
  fra: 'fr',
  fre: 'fr',
  por: 'pt',
  eng: 'en',
};

const LANGUAGE_NAMES: Record<string, string> = {
  ak: 'Twi (Akan)',
  ee: 'Ewe',
  ha: 'Hausa',
  yo: 'Yorùbá',
  ig: 'Igbo',
  sw: 'Kiswahili',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  am: 'Amharic',
  so: 'Somali',
  wo: 'Wolof',
  lg: 'Luganda',
  ln: 'Lingala',
  om: 'Afaan Oromo',
  rw: 'Kinyarwanda',
  ti: 'Tigrinya',
  sn: 'Shona',
  ny: 'Chichewa',
  ff: 'Fula',
  bm: 'Bambara',
  af: 'Afrikaans',
  tn: 'Setswana',
  pcm: 'Nigerian Pidgin',
  ar: 'Arabic',
  fr: 'French',
  pt: 'Portuguese',
  en: 'English',
};

/** `ak-GH`, `ak-gh-asante`, `tw`, `twi` → `ak`; `en-NG` → `en`. */
export function baseTtsLanguage(language: string | undefined | null): string | undefined {
  const raw = language?.trim().toLowerCase();
  if (!raw) return undefined;
  const primary = raw.split(/[-_]/)[0]!;
  return LANGUAGE_ALIASES[primary] ?? primary;
}

const ENGLISH_REGIONS: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  GH: 'Ghana',
  NG: 'Nigeria',
  KE: 'Kenya',
  ZA: 'South Africa',
  PH: 'Philippines',
  IE: 'Ireland',
  IN: 'India',
};

/** `en-AU` → `AU`; `ak-gh-asante` → `GH`; `en` → undefined. */
export function ttsRegion(language: string | undefined | null): string | undefined {
  const region = language?.trim().split(/[-_]/)[1];
  return region && /^[a-z]{2}$/i.test(region) ? region.toUpperCase() : undefined;
}

export function ttsLanguageName(language: string): string {
  const base = baseTtsLanguage(language) ?? language;
  const name = LANGUAGE_NAMES[base] ?? language;
  const region = ttsRegion(language);
  if (base === 'en' && region) return `${name} (${ENGLISH_REGIONS[region] ?? region})`;
  return name;
}

/**
 * English is spoken natively with many accents, so a regional English request (`en-AU`) only
 * matches a speaker from that country. A voice's country is the region of its `locale`.
 */
export function voiceSpeaksNatively(voice: TtsVoice, language: string | undefined): boolean {
  const base = baseTtsLanguage(language);
  if (!base) return true;
  if (!voice.languages.some((l) => baseTtsLanguage(l) === base)) return false;
  const region = ttsRegion(language);
  if (base === 'en' && region) return ttsRegion(voice.locale) === region;
  return true;
}

/**
 * Best native catalog voice for a language: primary language must match, a regional request
 * prefers (and for English requires) a speaker from that country, plain `en` defaults to US
 * English, and live voices win over ones still in training.
 */
export function findNativeVoice(voices: TtsVoice[], language: string): TtsVoice | undefined {
  const base = baseTtsLanguage(language);
  if (!base) return undefined;
  let candidates = voices.filter((v) => baseTtsLanguage(v.languages[0]) === base);
  const region = ttsRegion(language) ?? (base === 'en' ? 'US' : undefined);
  if (region) {
    const regional = candidates.filter((v) => ttsRegion(v.locale) === region);
    if (regional.length || base === 'en') candidates = regional;
  }
  return candidates.find((v) => v.status !== 'training') ?? candidates[0];
}

export function nativeVoiceUnavailable(language: string | undefined, detail?: string): ApiException {
  const name = language ? ttsLanguageName(language) : 'this language';
  return new ApiException(
    'native_voice_unavailable',
    `A native ${name} voice is not available yet. Lugemi only speaks a language with a voice from native speakers of it${detail ? ` (${detail})` : ''}.`,
    HttpStatus.UNPROCESSABLE_ENTITY,
  );
}
