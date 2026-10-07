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

export function ttsLanguageName(language: string): string {
  const base = baseTtsLanguage(language) ?? language;
  return LANGUAGE_NAMES[base] ?? language;
}

export function voiceSpeaksNatively(voice: TtsVoice, language: string | undefined): boolean {
  const base = baseTtsLanguage(language);
  if (!base) return true;
  return voice.languages.some((l) => baseTtsLanguage(l) === base);
}

/** First catalog voice whose primary (first-listed) language is the requested one. */
export function findNativeVoice(voices: TtsVoice[], language: string): TtsVoice | undefined {
  const base = baseTtsLanguage(language);
  if (!base) return undefined;
  return voices.find((v) => baseTtsLanguage(v.languages[0]) === base);
}

export function nativeVoiceUnavailable(language: string | undefined, detail?: string): ApiException {
  const name = language ? ttsLanguageName(language) : 'this language';
  return new ApiException(
    'native_voice_unavailable',
    `A native ${name} voice is not available yet. Lugemi only speaks a language with a voice from native speakers of it${detail ? ` (${detail})` : ''}.`,
    HttpStatus.UNPROCESSABLE_ENTITY,
  );
}
