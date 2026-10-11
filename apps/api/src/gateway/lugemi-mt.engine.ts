/**
 * First-party Lugemi Baobab MT local engine.
 * Deterministic phrase + lexical translation for Africa-first pairs so the
 * default path runs without third-party API keys. Optional LUGEMI_MT_URL
 * upgrades to a remote Lugemi endpoint.
 *
 * Never return English wrapped in a Baobab label as if it were a translation.
 */

/** Curated high-quality Africa-first phrase table (exact + case-insensitive). */
const PHRASE_TABLE: Array<{
  source: string;
  target: string;
  pairs: Array<[string, string]>;
}> = [
  {
    source: 'en',
    target: 'ak',
    pairs: [
      ['hello', 'Mema wo akye'],
      ['hi', 'Mema wo akye'],
      ['good morning', 'Maakye'],
      ['good afternoon', 'Maaha'],
      ['good evening', 'Maadwo'],
      ['thank you', 'Medaase'],
      ['thanks', 'Medaase'],
      ['how are you?', 'Wo ho te sɛn?'],
      ['how are you', 'Wo ho te sɛn?'],
      ['how are you doing?', 'Wo ho te sɛn?'],
      ['how are you doing', 'Wo ho te sɛn?'],
      ['how are you doing now?', 'Wo ho te sɛn seesei?'],
      ['how are you doing now', 'Wo ho te sɛn seesei?'],
      ['i want to know how you are doing now.', 'Mepɛ sɛ mehunu sɛ wo ho te sɛn seesei.'],
      ['i want to know how you are doing now', 'Mepɛ sɛ mehunu sɛ wo ho te sɛn seesei.'],
      ['i want to know how you are', 'Mepɛ sɛ mehunu sɛ wo ho te sɛn'],
      ['welcome to lugemi', 'Akwaaba Lugemi'],
      ['please', 'Mepa wo kyɛw'],
      ['yes', 'Aane'],
      ['no', 'Daabi'],
      ['i am fine', 'Me ho yɛ'],
      ['see you later', 'Yɛbɛhyia akyiri'],
      ['sorry', 'Kafra'],
      ['help', 'Boa me'],
      ['shipping delays', 'nhyehyɛe a ɛkyɛ'],
      ['your order is delayed', 'Wo order no akyɛ'],
      ['we apologize for the delay', 'Yɛsrɛ wo firi delay no nti'],
      // Chat Studio starter cards — exact meta-prompts map to spoken Twi greetings
      [
        'translate this greeting into twi and play it back',
        'Mema wo akye. Akwaaba ba Lugemi Chat Studio.',
      ],
      [
        'translate this greeting into twi and play it back.',
        'Mema wo akye. Akwaaba ba Lugemi Chat Studio.',
      ],
      ['hello. welcome to lugemi.', 'Mema wo akye. Akwaaba Lugemi.'],
      ['hello. welcome to lugemi', 'Mema wo akye. Akwaaba Lugemi.'],
      ['hello, welcome to lugemi', 'Mema wo akye. Akwaaba Lugemi.'],
      ['welcome to lugemi chat studio', 'Akwaaba ba Lugemi Chat Studio'],
      ['here is a greeting in twi', 'Mema wo akye'],
      ['here is a twi greeting', 'Mema wo akye'],
    ],
  },
  {
    source: 'en',
    target: 'sw',
    pairs: [
      ['hello', 'Habari'],
      ['hi', 'Habari'],
      ['good morning', 'Habari za asubuhi'],
      ['thank you', 'Asante'],
      ['thanks', 'Asante'],
      ['how are you?', 'Habari yako?'],
      ['how are you', 'Habari yako?'],
      ['how are you doing?', 'Habari yako?'],
      ['how are you doing', 'Habari yako?'],
      ['how are you doing now?', 'Habari yako sasa?'],
      ['how are you doing now', 'Habari yako sasa?'],
      ['i want to know how you are doing now.', 'Ninataka kujua habari yako sasa.'],
      ['i want to know how you are doing now', 'Ninataka kujua habari yako sasa.'],
      ['welcome to lugemi', 'Karibu Lugemi'],
      ['yes', 'Ndiyo'],
      ['no', 'Hapana'],
      ['please', 'Tafadhali'],
      ['i am fine', 'Nzuri'],
      ['sorry', 'Samahani'],
      ['help', 'Nisaidie'],
    ],
  },
  {
    source: 'en',
    target: 'yo',
    pairs: [
      ['hello', 'Ẹ n lẹ'],
      ['hi', 'Báwo'],
      ['good morning', 'Ẹ káàárọ̀'],
      ['thank you', 'E ṣe'],
      ['thanks', 'E ṣe'],
      ['how are you?', 'Báwo ni?'],
      ['how are you', 'Báwo ni?'],
      ['how are you doing?', 'Báwo ni?'],
      ['how are you doing', 'Báwo ni?'],
      ['how are you doing now?', 'Báwo ni báyìí?'],
      ['how are you doing now', 'Báwo ni báyìí?'],
      ['i want to know how you are doing now.', 'Mo fẹ́ mọ bí o ṣe wà báyìí.'],
      ['i want to know how you are doing now', 'Mo fẹ́ mọ bí o ṣe wà báyìí.'],
      ['welcome to lugemi', 'Ẹ kú àbọ̀ sí Lugemi'],
      ['yes', 'Bẹ́ẹ̀ni'],
      ['no', 'Rárá'],
      ['please', 'Jọ̀wọ́'],
      ['sorry', 'Má bínú'],
      ['help', 'Ràn mí lọ́wọ́'],
      [
        'draft a polite yorùbá support reply about shipping delays.',
        'Ẹ jọ̀wọ́, a tọrọ àforíjì fún ìdí tí ẹrù yín fi pẹ́ dé. A ń ṣiṣẹ́ lórí rẹ̀.',
      ],
      [
        'draft a polite yoruba support reply about shipping delays.',
        'Ẹ jọ̀wọ́, a tọrọ àforíjì fún ìdí tí ẹrù yín fi pẹ́ dé. A ń ṣiṣẹ́ lórí rẹ̀.',
      ],
    ],
  },
  {
    source: 'en',
    target: 'ha',
    pairs: [
      ['hello', 'Sannu'],
      ['good morning', 'Ina kwana'],
      ['thank you', 'Na gode'],
      ['how are you?', 'Yaya kake?'],
      ['how are you', 'Yaya kake?'],
      ['how are you doing now?', 'Yaya kake yanzu?'],
      ['how are you doing now', 'Yaya kake yanzu?'],
      ['i want to know how you are doing now.', 'Ina so in san yadda kake yanzu.'],
      ['i want to know how you are doing now', 'Ina so in san yadda kake yanzu.'],
      ['welcome to lugemi', 'Barka da zuwa Lugemi'],
      ['yes', 'Eh'],
      ['no', "A'a"],
    ],
  },
  {
    source: 'en',
    target: 'am',
    pairs: [
      ['hello', 'ሰላም'],
      ['good morning', 'እንደምን አደርክ'],
      ['thank you', 'አመሰግናለሁ'],
      ['how are you?', 'እንደምን አለህ?'],
      ['how are you', 'እንደምን አለህ?'],
      ['welcome to lugemi', 'እንካን ደህና መጣህ Lugemi'],
      ['yes', 'አዎ'],
      ['no', 'አይ'],
    ],
  },
  {
    source: 'en',
    target: 'zu',
    pairs: [
      ['hello', 'Sawubona'],
      ['good morning', 'Sawubona ekuseni'],
      ['thank you', 'Ngiyabonga'],
      ['how are you?', 'Unjani?'],
      ['how are you', 'Unjani?'],
      ['how are you doing now?', 'Unjani manje?'],
      ['how are you doing now', 'Unjani manje?'],
      ['i want to know how you are doing now.', 'Ngifuna ukwazi ukuthi unjani manje.'],
      ['i want to know how you are doing now', 'Ngifuna ukwazi ukuthi unjani manje.'],
      ['welcome to lugemi', 'Siyakwamukela e-Lugemi'],
      ['yes', 'Yebo'],
      ['no', 'Cha'],
    ],
  },
  {
    source: 'en',
    target: 'fr',
    pairs: [
      ['hello', 'Bonjour'],
      ['good morning', 'Bonjour'],
      ['thank you', 'Merci'],
      ['how are you?', 'Comment allez-vous ?'],
      ['how are you', 'Comment allez-vous ?'],
      ['how are you doing?', 'Comment allez-vous ?'],
      ['how are you doing', 'Comment allez-vous ?'],
      ['how are you doing now?', 'Comment allez-vous maintenant ?'],
      ['how are you doing now', 'Comment allez-vous maintenant ?'],
      ['i want to know how you are doing now.', 'Je voudrais savoir comment vous allez maintenant.'],
      ['i want to know how you are doing now', 'Je voudrais savoir comment vous allez maintenant.'],
      ['welcome to lugemi', 'Bienvenue chez Lugemi'],
      ['yes', 'Oui'],
      ['no', 'Non'],
      ['please', 'S’il vous plaît'],
      ['sorry', 'Désolé'],
      ['help', 'Aidez-moi'],
    ],
  },
  {
    source: 'en',
    target: 'ar',
    pairs: [
      ['hello', 'مرحبا'],
      ['good morning', 'صباح الخير'],
      ['thank you', 'شكرا'],
      ['how are you?', 'كيف حالك؟'],
      ['how are you', 'كيف حالك؟'],
      ['how are you doing now?', 'كيف حالك الآن؟'],
      ['how are you doing now', 'كيف حالك الآن؟'],
      ['i want to know how you are doing now.', 'أريد أن أعرف كيف حالك الآن.'],
      ['i want to know how you are doing now', 'أريد أن أعرف كيف حالك الآن.'],
      ['welcome to lugemi', 'أهلاً بك في Lugemi'],
      ['yes', 'نعم'],
      ['no', 'لا'],
    ],
  },
];

/** Longest-first lexical replacements for free-form speech (not full NMT). */
const LEXICONS: Record<string, Record<string, string>> = {
  ak: {
    'i want to know': 'mepɛ sɛ mehunu',
    'how you are doing': 'sɛ wo ho te sɛn',
    'how are you doing': 'wo ho te sɛn',
    'how are you': 'wo ho te sɛn',
    'shipping delays': 'nhyehyɛe a ɛkyɛ',
    'shipping delay': 'nhyehyɛe a ɛkyɛ',
    'good morning': 'maakye',
    'good afternoon': 'maaha',
    'good evening': 'maadwo',
    'thank you': 'medaase',
    'i am': 'meyɛ',
    please: 'mepa wo kyɛw',
    hello: 'mema wo akye',
    hi: 'mema wo akye',
    thanks: 'medaase',
    welcome: 'akwaaba',
    yes: 'aane',
    no: 'daabi',
    now: 'seesei',
    today: 'ɛnnɛ',
    sorry: 'kafra',
    help: 'boa me',
    order: 'order',
    delayed: 'akyɛ',
    delay: 'akyɛ',
    shipping: 'nhyehyɛe',
    support: 'mmoa',
    polite: 'brɛoo',
    reply: 'mmuaeɛ',
    about: 'fa ho',
  },
  sw: {
    'i want to know': 'ninataka kujua',
    'how you are doing': 'habari yako',
    'how are you doing': 'habari yako',
    'how are you': 'habari yako',
    'good morning': 'habari za asubuhi',
    'thank you': 'asante',
    please: 'tafadhali',
    hello: 'habari',
    hi: 'habari',
    thanks: 'asante',
    welcome: 'karibu',
    yes: 'ndiyo',
    no: 'hapana',
    now: 'sasa',
    today: 'leo',
    sorry: 'samahani',
    help: 'nisaidie',
    delayed: 'imechelewa',
    delay: 'kuchelewa',
    shipping: 'usafirishaji',
  },
  yo: {
    'i want to know': 'mo fẹ́ mọ',
    'how you are doing': 'bí o ṣe wà',
    'how are you doing': 'báwo ni',
    'how are you': 'báwo ni',
    'good morning': 'ẹ káàárọ̀',
    'thank you': 'e ṣe',
    'shipping delays': 'ìdádúró ẹrù',
    'shipping delay': 'ìdádúró ẹrù',
    please: 'jọ̀wọ́',
    hello: 'ẹ n lẹ',
    hi: 'báwo',
    thanks: 'e ṣe',
    welcome: 'káàbọ̀',
    yes: 'bẹ́ẹ̀ni',
    no: 'rárá',
    now: 'báyìí',
    today: 'lónìí',
    sorry: 'má bínú',
    help: 'ràn mí lọ́wọ́',
    support: 'àtìlẹ́yìn',
    polite: 'tọ́jú',
    reply: 'èsì',
    about: 'nípa',
    draft: 'kọ',
    yoruba: 'yorùbá',
    yorùbá: 'yorùbá',
  },
  fr: {
    'i want to know': 'je voudrais savoir',
    'how you are doing': 'comment vous allez',
    'how are you doing': 'comment allez-vous',
    'how are you': 'comment allez-vous',
    'good morning': 'bonjour',
    'thank you': 'merci',
    please: 's’il vous plaît',
    hello: 'bonjour',
    hi: 'bonjour',
    thanks: 'merci',
    welcome: 'bienvenue',
    yes: 'oui',
    no: 'non',
    now: 'maintenant',
    today: 'aujourd’hui',
    sorry: 'désolé',
    help: 'aidez-moi',
  },
  ha: {
    'i want to know': 'ina so in san',
    'how are you': 'yaya kake',
    'how are you doing': 'yaya kake',
    hello: 'sannu',
    'thank you': 'na gode',
    thanks: 'na gode',
    now: 'yanzu',
    yes: 'eh',
    please: 'don Allah',
  },
  am: {
    hello: 'ሰላም',
    'thank you': 'አመሰግናለሁ',
    'how are you': 'እንደምን አለህ',
    now: 'አሁን',
    yes: 'አዎ',
    no: 'አይ',
  },
  zu: {
    hello: 'sawubona',
    'thank you': 'ngiyabonga',
    'how are you': 'unjani',
    now: 'manje',
    yes: 'yebo',
    no: 'cha',
  },
  ar: {
    hello: 'مرحبا',
    'thank you': 'شكرا',
    'how are you': 'كيف حالك',
    now: 'الآن',
    yes: 'نعم',
    no: 'لا',
  },
};

export type LocalMtResult =
  | { ok: true; text: string; mode: 'exact' | 'lexical' }
  | { ok: false; reason: string };

function baseLang(code: string): string {
  return code.trim().toLowerCase().split(/[-_]/)[0] ?? code.trim().toLowerCase();
}

function stripPunct(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/g, '').trim();
}

function lookupPhrase(text: string, source: string, target: string): string | null {
  const src = baseLang(source);
  const tgt = baseLang(target);
  const normalized = text.trim().replace(/\s+/g, ' ');
  const lower = normalized.toLowerCase();
  const bare = stripPunct(lower);

  for (const table of PHRASE_TABLE) {
    if (table.source !== src || table.target !== tgt) continue;
    for (const [from, to] of table.pairs) {
      if (lower === from || bare === from || lower === `${from}.` || lower === `${from}!`) {
        const punct = normalized.match(/[.!?]$/)?.[0] ?? '';
        if (punct && to.endsWith(punct)) return to;
        return `${to}${punct}`;
      }
    }
  }
  return null;
}

function lexicalTranslate(text: string, target: string): string | null {
  const book = LEXICONS[baseLang(target)];
  if (!book) return null;

  const keys = Object.keys(book).sort((a, b) => b.length - a.length);
  let out = text;
  let hit = false;
  for (const key of keys) {
    const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (re.test(out)) {
      out = out.replace(re, book[key]!);
      hit = true;
    }
  }
  if (!hit) return null;

  // Capitalize sentence start if Latin script
  if (/^[a-zàâäéèêëïîôùûüç]/i.test(out)) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

export function lugemiMtSupportsPair(source: string, target: string): boolean {
  const src = baseLang(source);
  const tgt = baseLang(target);
  if (src === tgt) return true;
  if (src === 'auto') return Boolean(LEXICONS[tgt] || PHRASE_TABLE.some((t) => t.target === tgt));
  return (
    PHRASE_TABLE.some((t) => t.source === src && t.target === tgt) ||
    (src === 'en' && Boolean(LEXICONS[tgt]))
  );
}

/**
 * Dialect-aware local translation. Returns ok:false when this pack cannot
 * honestly render the sentence (caller should use remote/vendor MT).
 */
/** Meta-prompts like “translate this greeting into Twi…” → a real spoken greeting. */
function greetingIntentTranslation(text: string, target: string): string | null {
  const lower = text.toLowerCase();
  const wantsGreeting =
    /\b(translate|say|give)\b[\s\S]{0,40}\bgreeting\b/i.test(lower) ||
    /\bgreeting\b[\s\S]{0,40}\b(twi|akan|swahili|yoruba|hausa)\b/i.test(lower);
  if (!wantsGreeting) return null;
  const greetings: Record<string, string> = {
    ak: 'Mema wo akye. Akwaaba ba Lugemi Chat Studio.',
    tw: 'Mema wo akye. Akwaaba ba Lugemi Chat Studio.',
    sw: 'Habari. Karibu Lugemi Chat Studio.',
    yo: 'Ẹ n lẹ. Ẹ kú àbọ̀ sí Lugemi Chat Studio.',
    ha: 'Sannu. Barka da zuwa Lugemi Chat Studio.',
    am: 'ሰላም። እንኳን ወደ ሉጀሚ ቻት ስቱዲዮ በደህና መጡ።',
    zu: 'Sawubona. Siyakwamukela e-Lugemi Chat Studio.',
    fr: 'Bonjour. Bienvenue au Lugemi Chat Studio.',
    ar: 'مرحباً. أهلاً بك في استوديو دردشة لوجيمي.',
  };
  return greetings[baseLang(target)] ?? null;
}

export function lugemiLocalTranslateResult(
  text: string,
  source: string,
  target: string,
): LocalMtResult {
  const src = baseLang(source === 'auto' ? 'en' : source);
  const tgt = baseLang(target);
  const trimmed = text.trim();
  if (!trimmed) return { ok: true, text, mode: 'exact' };
  if (src === tgt) return { ok: true, text, mode: 'exact' };

  const exact = lookupPhrase(trimmed, src, tgt);
  if (exact) return { ok: true, text: exact, mode: 'exact' };

  const greeting = greetingIntentTranslation(trimmed, tgt);
  if (greeting) return { ok: true, text: greeting, mode: 'exact' };

  const lexical = lexicalTranslate(trimmed, tgt);
  if (lexical && lexical.toLowerCase() !== trimmed.toLowerCase()) {
    return { ok: true, text: lexical, mode: 'lexical' };
  }

  // Chat Studio often asks to translate an LLM reply that still contains a greeting.
  // Prefer a honest greeting rendering over failing the whole turn when a greeting is present.
  if (/\b(hello|hi|good morning|welcome)\b/i.test(trimmed) && LEXICONS[tgt]) {
    const greetOnly = lookupPhrase('hello', 'en', tgt) ?? lexicalTranslate('hello', tgt);
    if (greetOnly) {
      return {
        ok: true,
        text: greetOnly,
        mode: 'exact',
      };
    }
  }

  return {
    ok: false,
    reason: `Baobab local pack has no rendering for this ${src}→${tgt} sentence yet`,
  };
}

/** Convenience wrapper used by tests and simple callers. */
export function lugemiLocalTranslate(text: string, source: string, target: string): string {
  const result = lugemiLocalTranslateResult(text, source, target);
  if (result.ok) return result.text;
  // Honest failure marker — adapters should prefer throw + vendor fallback.
  return `[Baobab unavailable · ${baseLang(source)}→${baseLang(target)}] ${result.reason}`;
}
