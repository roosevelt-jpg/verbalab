/**
 * Native sample scripts for marketing / Explore / Studio previews.
 * Selecting a voice must load a script written in that voice's language —
 * never read one English draft with a foreign accent.
 */

import { DEMO_VOICE_PROFILES, type DemoVoiceProfile } from '@/lib/demo-speech';

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
  th: 'เสียง Lugemi นำงานสร้างสรรค์ การสนทนากับลูกค้า และสุนทรพจน์สาธารณะด้วยความชัดเจนในภาษาแอฟริกา',
  vi: 'Giọng nói Lugemi mang công việc sáng tạo, hội thoại khách hàng và diễn thuyết công khai với sự rõ ràng qua các ngôn ngữ châu Phi.',
  id: 'Suara Lugemi membawa karya kreatif, percakapan pelanggan, dan pidato publik dengan kejelasan di seluruh bahasa Afrika.',
  ms: 'Suara Lugemi membawa kerja kreatif, perbualan pelanggan, dan ucapan awam dengan kejelasan merentas bahasa Afrika.',
  es: 'Las voces Lugemi llevan trabajo creativo, conversaciones con clientes y discurso público con claridad a través de las lenguas africanas.',
  de: 'Lugemi-Stimmen tragen kreative Arbeit, Kundengespräche und öffentliche Rede mit Klarheit über afrikanische Sprachen.',
  hi: 'लुगेमी की आवाज़ें अफ़्रीकी भाषाओं में रचनात्मक काम, ग्राहक बातचीत और सार्वजनिक भाषण को स्पष्टता के साथ ले जाती हैं।',
  ja: 'Lugemiの声は、アフリカの言語にわたる創造的な仕事、顧客との会話、公のスピーチを明瞭に届けます。',
  ko: 'Lugemi 목소리는 아프리카 언어 전반에 걸쳐 창작 작업, 고객 대화, 공적 연설을 명확하게 전합니다.',
  zh: 'Lugemi 的声音以清晰与存在感承载创意工作、客户对话与公共演讲，覆盖非洲语言。',
  tr: 'Lugemi sesleri, Afrika dilleri boyunca yaratıcı işi, müşteri sohbetlerini ve kamusal konuşmayı netlikle taşır.',
  ru: 'Голоса Lugemi несут творческую работу, разговоры с клиентами и публичную речь с ясностью через африканские языки.',
  it: 'Le voci Lugemi portano lavoro creativo, conversazioni con i clienti e discorso pubblico con chiarezza attraverso le lingue africane.',
  nl: 'Lugemi-stemmen dragen creatief werk, klantgesprekken en openbare spraak met helderheid over Afrikaanse talen.',
  ht: 'Vwa Lugemi pote travay kreyatif, konvèsasyon kliyan, ak diskou piblik ak klète atravè lang Afriken yo.',
};

const LANG_ALIASES: Record<string, string> = {
  tw: 'ak',
  twi: 'ak',
  fat: 'ak',
  kiswahili: 'sw',
  swahili: 'sw',
  cmn: 'zh',
  'zh-cn': 'zh',
  'zh-tw': 'zh',
  'zh-hk': 'zh',
};

function baseLang(lang: string): string {
  const primary = lang.trim().toLowerCase().split(/[-_]/)[0] ?? '';
  return LANG_ALIASES[primary] ?? primary;
}

function normalizeVoiceKey(voiceId: string | null | undefined): string | null {
  if (!voiceId?.trim()) return null;
  const raw = voiceId.trim();
  const key = raw.startsWith('own:') ? raw.slice(4) : raw;
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(key)) return null;
  return key.toLowerCase();
}

export function nativeScriptForLang(lang: string | null | undefined): string {
  if (!lang?.trim()) return ENGLISH_PRODUCT_SCRIPT;
  const base = baseLang(lang);
  return NATIVE_DEMO_SCRIPTS[base] ?? ENGLISH_PRODUCT_SCRIPT;
}

/** Prefer curated profile when present; otherwise synthesize from voice id + lang. */
export function profileForVoice(
  voiceId: string | null | undefined,
  lang?: string | null,
): DemoVoiceProfile | undefined {
  const key = normalizeVoiceKey(voiceId);
  if (key && DEMO_VOICE_PROFILES[key]) return DEMO_VOICE_PROFILES[key];
  if (!key && !lang) return undefined;
  const resolvedLang = lang?.trim() || (key ? guessLangFromVoiceKey(key) : 'en-US');
  return {
    id: key ?? 'en-us-female',
    label: key ?? 'Voice',
    lang: resolvedLang,
    voice: key ? `own:${key}` : undefined,
  };
}

function guessLangFromVoiceKey(key: string): string {
  // own:sw-ke-female → sw-KE; own:en-ng-female → en-NG
  const m = key.match(/^([a-z]{2,3})(?:-([a-z]{2}))?/i);
  if (!m) return 'en-US';
  const lang = m[1]!.toLowerCase();
  const region = m[2]?.toUpperCase();
  if (region) return `${lang}-${region}`;
  return lang;
}

/**
 * Pick the best demo voice id for a BCP-47 / ISO language code.
 * Used by playground, chat play, and marketplace previews.
 */
export function demoVoiceForLang(lang: string | null | undefined): string {
  if (!lang?.trim()) return 'en-us-female';
  const normalized = lang.trim().replace('_', '-');
  const base = baseLang(normalized);
  const region = normalized.includes('-')
    ? normalized.split('-')[1]?.toUpperCase()
    : undefined;

  // Exact locale match first (en-NG, sw-KE, fr-SN, …).
  const localeKey = region ? `${base}-${region.toLowerCase()}` : null;
  if (localeKey) {
    const exact = Object.values(DEMO_VOICE_PROFILES).find(
      (p) => p.lang.toLowerCase() === `${base}-${region}`.toLowerCase() && p.voice,
    );
    if (exact) return exact.id;
  }

  const byBase = Object.values(DEMO_VOICE_PROFILES).find(
    (p) => baseLang(p.lang) === base && p.voice,
  );
  if (byBase) return byBase.id;

  // Remapped L1 packs → cultural English/French of the same region family.
  const REMAP_VOICE: Record<string, string> = {
    ak: 'kwame',
    yo: 'abe',
    ig: 'abe',
    ha: 'abe',
    pcm: 'abe',
    zu: 'thandi',
    xh: 'thandi',
    wo: 'fr-sn-female',
    ff: 'fr-sn-female',
    bm: 'fr-sn-female',
    lg: 'en-ke-female',
    rw: 'en-ke-female',
    so: 'en-ke-female',
    sn: 'thandi',
    ny: 'thandi',
    ti: 'am-et-female',
  };
  if (REMAP_VOICE[base]) return REMAP_VOICE[base]!;

  return base === 'en' ? 'en-us-female' : 'en-us-female';
}

/** Resolve BCP-47 + native sample for a marketing / hero voice id. */
export function resolveVoiceDemoScript(voiceId: string | null | undefined): {
  lang: string;
  text: string;
} {
  const profile = profileForVoice(voiceId);
  const lang = profile?.lang ?? 'en-NG';
  return { lang, text: nativeScriptForLang(lang) };
}

/**
 * Resolve preview play input so voice language and script always match.
 * Pass `text` only when the caller already has language-true copy (e.g. translated result).
 * Omit `text` (or pass empty) to load the native product sample for that voice/lang.
 */
export function resolveDemoPreview(input: {
  voiceId?: string | null;
  lang?: string | null;
  text?: string | null;
  /** When true, ignore caller text and always use the native sample for the voice lang. */
  forceNative?: boolean;
}): { voiceId: string; lang: string; text: string } {
  const langHint = input.lang?.trim() || undefined;
  const voiceId =
    normalizeVoiceKey(input.voiceId) ??
    (langHint ? demoVoiceForLang(langHint) : 'en-us-female');
  const profile = profileForVoice(voiceId, langHint);
  const lang = langHint || profile?.lang || 'en-US';
  const callerText = input.text?.trim() ?? '';
  const text =
    input.forceNative || !callerText
      ? nativeScriptForLang(lang)
      : callerText;
  return { voiceId, lang, text };
}

/** True when text looks like a generic English preview that should be replaced on voice change. */
export function isGenericEnglishPreview(text: string | null | undefined): boolean {
  if (!text?.trim()) return true;
  const t = text.trim();
  if (/welcome to lugemi/i.test(t)) return true;
  if (/hello from .+lugemi/i.test(t)) return true;
  if (/speaking with /i.test(t) && /lugemi/i.test(t)) return true;
  if (/marketplace voice preview/i.test(t)) return true;
  if (/this is a lugemi/i.test(t)) return true;
  if (/audio tags|type your text|expressive speech/i.test(t)) return true;
  if (t === ENGLISH_PRODUCT_SCRIPT) return true;
  return false;
}
