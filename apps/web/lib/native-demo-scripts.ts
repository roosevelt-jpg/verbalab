/**
 * Native sample scripts for marketing / Explore demos.
 * Selecting a voice must load a script written in that voice's language —
 * never read one English draft with a foreign accent.
 */

import { DEMO_VOICE_PROFILES } from '@/lib/demo-speech';

/** Canonical product line in English (Nigerian / Ghanaian / SA / etc. accents). */
export const ENGLISH_PRODUCT_SCRIPT =
  'Lugemi voices carry creative work, customer conversations, and public speech with literacy and presence across African languages.';

/** Short native samples keyed by primary ISO 639-1 / BCP-47 base. */
export const NATIVE_DEMO_SCRIPTS: Record<string, string> = {
  en: ENGLISH_PRODUCT_SCRIPT,
  sw: 'Sauti za Lugemi hubeba kazi za ubunifu, mazungumzo na wateja, na hotuba za umma kwa kusoma na uwepo katika lugha za Kiafrika.',
  fr: 'Les voix Lugemi portent le travail créatif, les conversations clients et la parole publique avec clarté et présence à travers les langues africaines.',
  am: 'የሉገሚ ድምፆች የፈጠራ ስራ፣ የደንበኛ ውይይቶች እና የህዝብ ንግግር በአፍሪካ ቋንቋዎች በንባብ እና በመገኘት ይይዛሉ።',
  ar: 'أصوات لوجيمي تحمل العمل الإبداعي ومحادثات العملاء والخطاب العام بوضوح وحضور عبر اللغات الأفريقية.',
  af: 'Lugemi-stemme dra kreatiewe werk, kliëntgesprekke en openbare spraak met geletterdheid en teenwoordigheid oor Afrika-tale.',
  yo: 'Àwọn ohùn Lugemi ń gbé iṣẹ́ ìṣẹ̀dá, ìjíròrò oníbàárà, àti ọ̀rọ̀ ìgboro pẹ̀lú ìmọ̀-ọ̀rọ̀ àti wíwà nínú àwọn èdè Áfríkà.',
  zu: 'Amazwi e-Lugemi aphatha umsebenzi wokudala, izingxoxo zamakhasimende, nenkulumo yomphakathi ngokufunda nokuba khona ezilimini zase-Afrika.',
  ha: 'Muryoyin Lugemi suna ɗaukar aikin ƙirƙira, tattaunawa da abokan ciniki, da maganganun jama\'a tare da ilimi da kasancewa a cikin harsunan Afirka.',
  ak: 'Lugemi nne ma ɔka adwuma a wɔyɛ, nkɔmmɔdie a ɛfa adetɔfo ho, ne ɔman kasa a ɛwɔ Africa kasa ahorow mu.',
  pt: 'As vozes Lugemi carregam trabalho criativo, conversas com clientes e discurso público com clareza e presença nas línguas africanas.',
  ig: 'Olu Lugemi na-ebu ọrụ okike, mkparịta ụka ndị ahịa, na okwu ọha na eze n\'asụsụ Africa.',
  so: 'Codadka Lugemi waxay qaadaan shaqada hal-abuurka, wadahadalka macaamiisha, iyo hadalka dadweynaha ee luqadaha Afrika.',
  om: 'Sagaleewwan Lugemi hojii uumamaa, haasaa maamiltootaa fi haasaa ummataa afaanota Afrikaa keessatti qabatu.',
};

const LANG_ALIASES: Record<string, string> = {
  tw: 'ak',
  twi: 'ak',
  fat: 'ak',
  kiswahili: 'sw',
  swahili: 'sw',
};

function baseLang(lang: string): string {
  const primary = lang.trim().toLowerCase().split(/[-_]/)[0] ?? '';
  return LANG_ALIASES[primary] ?? primary;
}

export function nativeScriptForLang(lang: string | null | undefined): string {
  if (!lang?.trim()) return ENGLISH_PRODUCT_SCRIPT;
  const base = baseLang(lang);
  return NATIVE_DEMO_SCRIPTS[base] ?? ENGLISH_PRODUCT_SCRIPT;
}

/** Resolve BCP-47 + native sample for a marketing / hero voice id. */
export function resolveVoiceDemoScript(voiceId: string | null | undefined): {
  lang: string;
  text: string;
} {
  const key = (voiceId ?? '').trim().toLowerCase().replace(/^own:/, '');
  const profile = key ? DEMO_VOICE_PROFILES[key] : undefined;
  const lang = profile?.lang ?? 'en-NG';
  return { lang, text: nativeScriptForLang(lang) };
}
