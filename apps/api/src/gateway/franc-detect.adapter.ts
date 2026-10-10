import { DetectInput, DetectOutput, LanguageDetectProvider } from './detect-provider';

/** ISO 639-3 → registry codes for languages we care about. */
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
  aka: 'ak', ewe: 'ee', bam: 'bm', ful: 'ff', run: 'rn', sag: 'sg', tso: 'ts',
  ven: 've', nbl: 'nr', nde: 'nd', ssw: 'ss', bem: 'bem', kik: 'ki', luo: 'luo', mlg: 'mg', nso: 'nso',
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
