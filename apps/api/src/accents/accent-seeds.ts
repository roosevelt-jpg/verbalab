import { LANGUAGE_SEEDS } from '../languages/language-seeds';
import { LOCALE_PACK_SEEDS, LOCALE_VARIANT_SEEDS } from '../locales/locale-pack-seeds';
import { COUNTRY_PACK_SEEDS } from '../country-packs/country-pack-seeds';

export type AccentSeed = {
  code: string;
  languageCode: string;
  nameEn: string;
  nameNative?: string;
  region?: string;
  relatedDialectCode?: string;
  cueTerms: string[];
  notes?: string;
};

type AccentOverride = Partial<Omit<AccentSeed, 'code' | 'languageCode'>> & {
  code: string;
  languageCode: string;
  cueTerms: string[];
};

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function regionLabel(region?: string): string {
  if (!region) return '';
  try {
    return regionNames.of(region.toUpperCase()) ?? region.toUpperCase();
  } catch {
    return region.toUpperCase();
  }
}

function bcp47ToAccentCode(bcp47: string): string {
  return bcp47.trim().toLowerCase().replace(/_/g, '-');
}

function parseRegion(bcp47: string): string | undefined {
  const parts = bcp47.split(/[-_]/);
  const region = parts[1];
  return region && /^[A-Za-z]{2}$/.test(region) ? region.toUpperCase() : undefined;
}

/**
 * Rich cue overrides for high-signal spoken profiles.
 * Catalog coverage comes from languages + locale/country packs — not this list alone.
 */
const CURATED_ACCENT_OVERRIDES: AccentOverride[] = [
  {
    code: 'en-ng',
    languageCode: 'en',
    nameEn: 'Nigerian English (spoken)',
    region: 'NG',
    relatedDialectCode: 'en-ng',
    cueTerms: ['abi', 'na wa', 'how far', 'oya', 'wetin', 'sef', 'abeg'],
    notes: 'Lexical proxies for spoken Nigerian English — cue/transcript scoring, not acoustic ID.',
  },
  {
    code: 'en-za',
    languageCode: 'en',
    nameEn: 'South African English (spoken)',
    region: 'ZA',
    relatedDialectCode: 'en-za',
    cueTerms: ['lekker', 'braai', 'robot', 'just now', 'sharp sharp', 'howzit'],
    notes: 'Lexical proxies — cue/transcript scoring, not acoustic ID.',
  },
  {
    code: 'en-ke',
    languageCode: 'en',
    nameEn: 'Kenyan English (spoken)',
    region: 'KE',
    cueTerms: ['sasa', 'pole', 'hakuna', 'niaje', 'kwani', 'mzungu'],
    notes: 'Kenyan English / Sheng-adjacent spoken cues.',
  },
  {
    code: 'en-gh',
    languageCode: 'en',
    nameEn: 'Ghanaian English (spoken)',
    region: 'GH',
    cueTerms: ['chale', 'paa', 'charley', 'small small', 'please', 'eh'],
    notes: 'Common Ghanaian English lexical cues.',
  },
  {
    code: 'fr-sn',
    languageCode: 'fr',
    nameEn: 'Senegalese French (spoken)',
    region: 'SN',
    cueTerms: ['waaw', 'déédéét', 'amul', 'jërëjëf', 'nanga def'],
    notes: 'Wolof-influenced French spoken cues mixed with French.',
  },
  {
    code: 'fr-ci',
    languageCode: 'fr',
    nameEn: 'Ivorian French (spoken)',
    region: 'CI',
    cueTerms: ['yako', 'on est ensemble', 'il y a moyen', 'en tout cas', 'même'],
    notes: 'Nouchi / Ivorian spoken French proxies.',
  },
  {
    code: 'ar-eg',
    languageCode: 'ar',
    nameEn: 'Egyptian Arabic (spoken)',
    region: 'EG',
    relatedDialectCode: 'ar-eg',
    cueTerms: ['ازيك', 'كده', 'مش', 'علشان', 'يعني', 'دلوقتي'],
    notes: 'Colloquial Egyptian spoken cues.',
  },
  {
    code: 'sw-ke',
    languageCode: 'sw',
    nameEn: 'Kenyan Swahili (spoken)',
    region: 'KE',
    relatedDialectCode: 'sw-ke',
    cueTerms: ['sasa', 'poa', 'niaje', 'bro', 'uko aje', 'safi'],
    notes: 'Spoken Kenyan Swahili / Sheng-adjacent cues.',
  },
  {
    code: 'ha-ng',
    languageCode: 'ha',
    nameEn: 'Nigerian Hausa (spoken)',
    region: 'NG',
    relatedDialectCode: 'ha-ng',
    cueTerms: ['sannu', 'na gode', 'yaya', 'ina kwana', 'lahiya'],
    notes: 'Spoken greeting/lexical cues.',
  },
  {
    code: 'zu-za',
    languageCode: 'zu',
    nameEn: 'South African Zulu (spoken)',
    region: 'ZA',
    relatedDialectCode: 'zu-za',
    cueTerms: ['sawubona', 'ngiyabonga', 'unjani', 'yebo', 'cha'],
    notes: 'Spoken greeting/lexical cues.',
  },
  {
    code: 'ak-gh',
    languageCode: 'ak',
    nameEn: 'Ghanaian Twi (spoken)',
    region: 'GH',
    relatedDialectCode: 'ak-gh-asante',
    cueTerms: ['medaase', 'akwaaba', 'ɛte sɛn'],
    notes: 'Asante Twi spoken cues — default Lugemi demo accent.',
  },
  {
    code: 'ig-ng',
    languageCode: 'ig',
    nameEn: 'Nigerian Igbo (spoken)',
    region: 'NG',
    cueTerms: ['ndewo', 'daalụ', 'kedu', 'biko'],
    notes: 'Spoken Igbo greeting cues.',
  },
  {
    code: 'wo-sn',
    languageCode: 'wo',
    nameEn: 'Senegalese Wolof (spoken)',
    region: 'SN',
    cueTerms: ['nanga def', 'jërëjëf', 'waaw'],
    notes: 'Spoken Wolof cues.',
  },
  {
    code: 'pcm-ng',
    languageCode: 'pcm',
    nameEn: 'Nigerian Pidgin (spoken)',
    region: 'NG',
    cueTerms: ['how far', 'abeg', 'wahala'],
    notes: 'Naijá spoken cues.',
  },
  {
    code: 'xh-za',
    languageCode: 'xh',
    nameEn: 'South African Xhosa (spoken)',
    region: 'ZA',
    cueTerms: ['molo', 'enkosi', 'unjani'],
    notes: 'Spoken isiXhosa cues.',
  },
  {
    code: 'th-th',
    languageCode: 'th',
    nameEn: 'Bangkok Thai (spoken)',
    region: 'TH',
    cueTerms: ['khrap', 'kha'],
    notes: 'Central Thai spoken cues.',
  },
  {
    code: 'vi-vn',
    languageCode: 'vi',
    nameEn: 'Hanoi Vietnamese (spoken)',
    region: 'VN',
    cueTerms: ['a', 'nhe'],
    notes: 'Northern Vietnamese spoken cues.',
  },
  {
    code: 'ms-my',
    languageCode: 'ms',
    nameEn: 'Kuala Lumpur Malay (spoken)',
    region: 'MY',
    cueTerms: ['lah', 'terima kasih'],
    notes: 'Malaysian Malay spoken cues.',
  },
  {
    code: 'fil-ph',
    languageCode: 'fil',
    nameEn: 'Manila Filipino (spoken)',
    region: 'PH',
    cueTerms: ['po', 'opo'],
    notes: 'Manila Filipino spoken cues.',
  },
  {
    code: 'fa-ir',
    languageCode: 'fa',
    nameEn: 'Tehran Persian (spoken)',
    region: 'IR',
    cueTerms: ['mersi'],
    notes: 'Tehrani spoken cues.',
  },
  {
    code: 'he-il',
    languageCode: 'he',
    nameEn: 'Tel Aviv Hebrew (spoken)',
    region: 'IL',
    cueTerms: ['shalom', 'yalla'],
    notes: 'Modern Hebrew spoken cues.',
  },
  {
    code: 'ur-pk',
    languageCode: 'ur',
    nameEn: 'Karachi Urdu (spoken)',
    region: 'PK',
    cueTerms: ['shukriya'],
    notes: 'Urdu spoken cues.',
  },
  {
    code: 'ar-sa',
    languageCode: 'ar',
    nameEn: 'Gulf Arabic (spoken)',
    region: 'SA',
    cueTerms: ['shlonak'],
    notes: 'Gulf Arabic spoken cues.',
  },
  {
    code: 'ar-lb',
    languageCode: 'ar',
    nameEn: 'Levantine Arabic (spoken)',
    region: 'LB',
    cueTerms: ['kifak', 'yalla'],
    notes: 'Levantine spoken cues.',
  },
  {
    code: 'de-de',
    languageCode: 'de',
    nameEn: 'Berlin German (spoken)',
    region: 'DE',
    cueTerms: ['moin', 'bitte'],
    notes: 'German spoken cues.',
  },
  {
    code: 'fr-fr',
    languageCode: 'fr',
    nameEn: 'Parisian French (spoken)',
    region: 'FR',
    cueTerms: ['ouais', 'bah'],
    notes: 'Metropolitan French spoken cues.',
  },
  {
    code: 'es-mx',
    languageCode: 'es',
    nameEn: 'Mexico City Spanish (spoken)',
    region: 'MX',
    cueTerms: ['orale', 'que onda'],
    notes: 'Mexican Spanish spoken cues.',
  },
  {
    code: 'es-ar',
    languageCode: 'es',
    nameEn: 'Buenos Aires Spanish (spoken)',
    region: 'AR',
    cueTerms: ['che'],
    notes: 'Rioplatense spoken cues.',
  },
  {
    code: 'pt-br',
    languageCode: 'pt',
    nameEn: 'Sao Paulo Portuguese (spoken)',
    region: 'BR',
    cueTerms: ['cara', 'valeu'],
    notes: 'Brazilian Portuguese spoken cues.',
  },
  {
    code: 'en-gb',
    languageCode: 'en',
    nameEn: 'British English (spoken)',
    region: 'GB',
    cueTerms: ['cheers', 'mate'],
    notes: 'British English spoken cues.',
  },
  {
    code: 'en-us',
    languageCode: 'en',
    nameEn: 'General American (spoken)',
    region: 'US',
    cueTerms: ['yeah', 'okay'],
    notes: 'General American spoken cues.',
  },
  {
    code: 'cy-gb',
    languageCode: 'cy',
    nameEn: 'Welsh (spoken)',
    region: 'GB',
    cueTerms: ['diolch'],
    notes: 'Welsh spoken cues.',
  },
  {
    code: 'qu-pe',
    languageCode: 'qu',
    nameEn: 'Cusco Quechua (spoken)',
    region: 'PE',
    cueTerms: ['sulpayki'],
    notes: 'Quechua spoken cues.',
  },
  {
    code: 'ht-ht',
    languageCode: 'ht',
    nameEn: 'Port-au-Prince Kreyol (spoken)',
    region: 'HT',
    cueTerms: ['mesi', 'sak pase'],
    notes: 'Haitian Creole spoken cues.',
  },
  {
    code: 'fr-ca',
    languageCode: 'fr',
    nameEn: 'Quebecois French (spoken)',
    region: 'CA',
    cueTerms: ['icitte'],
    notes: 'Quebecois spoken cues.',
  },
  {
    code: 'haw-us',
    languageCode: 'haw',
    nameEn: 'Hawaiian (spoken)',
    region: 'US',
    cueTerms: ['aloha', 'mahalo'],
    notes: 'Hawaiian spoken cues.',
  },
  {
    code: 'nv-us',
    languageCode: 'nv',
    nameEn: 'Navajo (spoken)',
    region: 'US',
    cueTerms: ['yaateeh'],
    notes: 'Navajo spoken cues.',
  },
];

function defaultSpokenName(languageCode: string, region?: string, hint?: string): string {
  const lang = LANGUAGE_SEEDS.find((l) => l.code === languageCode);
  const langName = lang?.nameEn ?? languageCode;
  if (hint?.trim() && !/locale pack/i.test(hint)) {
    const cleaned = hint.replace(/\.$/, '').trim();
    if (cleaned.toLowerCase().includes('spoken')) return cleaned;
    return `${cleaned} (spoken)`;
  }
  const place = regionLabel(region);
  return place ? `${langName} (${place}) (spoken)` : `${langName} (spoken)`;
}

function upsertAccent(
  byCode: Map<string, AccentSeed>,
  input: {
    code: string;
    languageCode: string;
    region?: string;
    nameEn?: string;
    nameNative?: string;
    relatedDialectCode?: string;
    cueTerms?: string[];
    notes?: string;
    hint?: string;
  },
) {
  if (!input.languageCode || !LANGUAGE_SEEDS.some((l) => l.code === input.languageCode)) return;
  const code = bcp47ToAccentCode(input.code);
  if (!code) return;
  const existing = byCode.get(code);
  const region = input.region ?? existing?.region;
  const next: AccentSeed = {
    code,
    languageCode: input.languageCode,
    nameEn: input.nameEn ?? existing?.nameEn ?? defaultSpokenName(input.languageCode, region, input.hint),
    nameNative:
      input.nameNative ??
      existing?.nameNative ??
      LANGUAGE_SEEDS.find((l) => l.code === input.languageCode)?.nameNative,
    region,
    relatedDialectCode: input.relatedDialectCode ?? existing?.relatedDialectCode,
    cueTerms: input.cueTerms ?? existing?.cueTerms ?? [],
    notes:
      input.notes ??
      existing?.notes ??
      'Spoken accent profile from language/locale registry — cue/transcript scoring, not acoustic phonetics.',
  };
  byCode.set(code, next);
}

/**
 * Full spoken-accent registry: every language/locale gets ≥1 profile.
 * Built from locale packs, locale variants, country packs, plus curated cue overrides.
 */
export function buildAccentSeeds(): AccentSeed[] {
  const byCode = new Map<string, AccentSeed>();

  for (const pack of LOCALE_PACK_SEEDS) {
    if (!pack.bcp47) continue;
    upsertAccent(byCode, {
      code: pack.bcp47,
      languageCode: pack.languageCode,
      region: parseRegion(pack.bcp47),
      hint: pack.culturalNotes,
    });
  }

  for (const variant of LOCALE_VARIANT_SEEDS) {
    upsertAccent(byCode, {
      code: variant.bcp47,
      languageCode: variant.languageCode,
      region: parseRegion(variant.bcp47),
      hint: variant.culturalNotes,
    });
  }

  for (const country of COUNTRY_PACK_SEEDS) {
    for (const tag of country.bcp47Tags ?? []) {
      const languageCode = tag.split(/[-_]/)[0]?.toLowerCase();
      if (!languageCode) continue;
      upsertAccent(byCode, {
        code: tag,
        languageCode,
        region: country.code,
        hint: `${country.nameEn} ${LANGUAGE_SEEDS.find((l) => l.code === languageCode)?.nameEn ?? languageCode}`,
      });
    }
  }

  for (const override of CURATED_ACCENT_OVERRIDES) {
    upsertAccent(byCode, {
      ...override,
      cueTerms: override.cueTerms,
      notes: override.notes,
    });
  }

  for (const lang of LANGUAGE_SEEDS) {
    const has = [...byCode.values()].some((a) => a.languageCode === lang.code);
    if (has) continue;
    const pack = LOCALE_PACK_SEEDS.find((p) => p.languageCode === lang.code);
    const code = pack?.bcp47 ? bcp47ToAccentCode(pack.bcp47) : lang.code;
    upsertAccent(byCode, {
      code,
      languageCode: lang.code,
      region: pack?.bcp47 ? parseRegion(pack.bcp47) : undefined,
      nameEn: `${lang.nameEn} (spoken)`,
      nameNative: lang.nameNative,
      cueTerms: [],
      notes: 'Fallback spoken profile for registry language — cue/transcript scoring, not acoustic phonetics.',
    });
  }

  return [...byCode.values()].sort((a, b) => {
    const langCmp = a.languageCode.localeCompare(b.languageCode);
    return langCmp !== 0 ? langCmp : a.code.localeCompare(b.code);
  });
}

export const ACCENT_SEEDS: AccentSeed[] = buildAccentSeeds();
export const ACCENT_SEED_COUNT = ACCENT_SEEDS.length;
