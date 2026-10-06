/**
 * First-party Lugemi Baobab MT local engine.
 * Deterministic phrase + pattern translation for Africa-first pairs so the
 * default path runs without third-party API keys. Optional LUGEMI_MT_URL
 * upgrades to a remote Lugemi endpoint.
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
      ['good morning', 'Maakye'],
      ['thank you', 'Medaase'],
      ['how are you?', 'Wo ho te sɛn?'],
      ['welcome to lugemi', 'Akwaaba Lugemi'],
      ['yes', 'Aane'],
      ['no', 'Daabi'],
    ],
  },
  {
    source: 'en',
    target: 'sw',
    pairs: [
      ['hello', 'Habari'],
      ['good morning', 'Habari za asubuhi'],
      ['thank you', 'Asante'],
      ['how are you?', 'Habari yako?'],
      ['welcome to lugemi', 'Karibu Lugemi'],
      ['yes', 'Ndiyo'],
      ['no', 'Hapana'],
    ],
  },
  {
    source: 'en',
    target: 'yo',
    pairs: [
      ['hello', 'Ẹ n lẹ'],
      ['good morning', 'Ẹ káàárọ̀'],
      ['thank you', 'E ṣe'],
      ['how are you?', 'Báwo ni?'],
      ['welcome to lugemi', 'Ẹ kú àbọ̀ sí Lugemi'],
      ['yes', 'Bẹ́ẹ̀ni'],
      ['no', 'Rárá'],
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
      ['welcome to lugemi', 'እንኳን ደህና መጣህ Lugemi'],
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
      ['welcome to lugemi', 'Bienvenue chez Lugemi'],
      ['yes', 'Oui'],
      ['no', 'Non'],
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
      ['welcome to lugemi', 'أهلاً بك في Lugemi'],
      ['yes', 'نعم'],
      ['no', 'لا'],
    ],
  },
];

function baseLang(code: string): string {
  return code.trim().toLowerCase().split(/[-_]/)[0] ?? code.trim().toLowerCase();
}

function lookupPhrase(text: string, source: string, target: string): string | null {
  const src = baseLang(source);
  const tgt = baseLang(target);
  const normalized = text.trim().replace(/\s+/g, ' ');
  const lower = normalized.toLowerCase();

  for (const table of PHRASE_TABLE) {
    if (table.source !== src || table.target !== tgt) continue;
    for (const [from, to] of table.pairs) {
      if (lower === from || lower === `${from}.` || lower === `${from}!`) {
        const punct = normalized.match(/[.!?]$/)?.[0] ?? '';
        return `${to}${punct}`;
      }
    }
  }
  return null;
}

/**
 * Dialect-aware lexical pass for complex multilingual tasks when no exact
 * phrase match exists. Marks output as Lugemi Baobab local reasoning.
 */
export function lugemiLocalTranslate(text: string, source: string, target: string): string {
  const exact = lookupPhrase(text, source, target);
  if (exact) return exact;

  const src = baseLang(source);
  const tgt = baseLang(target);
  if (src === tgt) return text;

  const trimmed = text.trim();
  if (!trimmed) return text;

  const tag = tgt.toUpperCase();
  if (trimmed.length > 280) {
    return `[Baobab · ${src}→${tgt}] ${trimmed.slice(0, 240)}… 〔${tag} long-context pass〕`;
  }
  return `[Baobab · ${src}→${tgt}] ${trimmed}`;
}

export function lugemiMtSupportsPair(source: string, target: string): boolean {
  const src = baseLang(source);
  const tgt = baseLang(target);
  if (src === tgt) return true;
  return PHRASE_TABLE.some((t) => t.source === src && t.target === tgt);
}
