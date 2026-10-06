import { DetectInput, DetectOutput, LanguageDetectProvider } from './detect-provider';

/** ISO 639-3 → 639-1 for languages we care about in the registry. */
const ISO3_TO_1: Record<string, string> = {
  eng: 'en',
  fra: 'fr',
  spa: 'es',
  por: 'pt',
  ara: 'ar',
  swa: 'sw',
  yor: 'yo',
  hau: 'ha',
  ibo: 'ig',
  zul: 'zu',
  xho: 'xh',
  afr: 'af',
  amh: 'am',
  som: 'so',
  kin: 'rw',
  nya: 'ny',
  sna: 'sn',
  sot: 'st',
  tsn: 'tn',
  wol: 'wo',
  lin: 'ln',
  lug: 'lg',
  orm: 'om',
  tir: 'ti',
};

/**
 * Offline Latin-script-oriented fallback when Google detect is unavailable.
 * Uses dynamic import because franc-min is ESM-only.
 */
export class FrancDetectAdapter implements LanguageDetectProvider {
  readonly name = 'franc_min';

  async detect(input: DetectInput): Promise<DetectOutput> {
    const { franc } = await import('franc-min');
    const iso3 = franc(input.text, { minLength: 3 });
    if (!iso3 || iso3 === 'und') {
      return { language: 'en', confidence: 0.1, provider: this.name };
    }
    const language = ISO3_TO_1[iso3] ?? iso3.slice(0, 2);
    return {
      language,
      confidence: 0.55,
      provider: this.name,
    };
  }
}
