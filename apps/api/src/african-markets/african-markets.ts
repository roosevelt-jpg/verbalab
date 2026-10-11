import { COUNTRY_PACK_SEEDS } from '../country-packs/country-pack-seeds';
import { LANGUAGE_SEEDS } from '../languages/language-seeds';

/**
 * Priority African markets for Everyday / LearnBack / Relay language corridors.
 * Named markets from product request plus other large African economies.
 */
export const AFRICAN_MARKET_CODES = [
  // Explicit request
  'ZA',
  'NG',
  'RW',
  'ET',
  'KE',
  'UG',
  'ZW',
  'ZM',
  'TZ',
  'GH',
  // Other large / strategic African markets
  'EG',
  'MA',
  'DZ',
  'TN',
  'SN',
  'CI',
  'CM',
  'CD',
  'AO',
  'MZ',
  'BW',
  'NA',
  'MG',
  'ML',
  'BF',
  'NE',
  'GN',
  'BJ',
  'TG',
  'LR',
  'SL',
  'GM',
  'BI',
  'MW',
  'LS',
  'SZ',
  'MU',
  'SC',
  'CG',
  'GA',
  'CF',
  'SS',
  'ER',
  'DJ',
  'SO',
  'TD',
  'CV',
  'GW',
  'GQ',
  'ST',
  'KM',
  'LY',
  'SD',
] as const;

export type AfricanMarketCode = (typeof AFRICAN_MARKET_CODES)[number];

const LANGUAGE_BY_CODE = new Map(LANGUAGE_SEEDS.map((l) => [l.code, l]));

/** IANA timezones for market jurisdictions. */
export const MARKET_TIMEZONES: Record<string, string> = {
  ZA: 'Africa/Johannesburg',
  NG: 'Africa/Lagos',
  RW: 'Africa/Kigali',
  ET: 'Africa/Addis_Ababa',
  KE: 'Africa/Nairobi',
  UG: 'Africa/Kampala',
  ZW: 'Africa/Harare',
  ZM: 'Africa/Lusaka',
  TZ: 'Africa/Dar_es_Salaam',
  GH: 'Africa/Accra',
  EG: 'Africa/Cairo',
  MA: 'Africa/Casablanca',
  DZ: 'Africa/Algiers',
  TN: 'Africa/Tunis',
  SN: 'Africa/Dakar',
  CI: 'Africa/Abidjan',
  CM: 'Africa/Douala',
  CD: 'Africa/Kinshasa',
  AO: 'Africa/Luanda',
  MZ: 'Africa/Maputo',
  BW: 'Africa/Gaborone',
  NA: 'Africa/Windhoek',
  MG: 'Africa/Nairobi',
  ML: 'Africa/Bamako',
  BF: 'Africa/Ouagadougou',
  NE: 'Africa/Niamey',
  GN: 'Africa/Conakry',
  BJ: 'Africa/Porto-Novo',
  TG: 'Africa/Lome',
  LR: 'Africa/Monrovia',
  SL: 'Africa/Freetown',
  GM: 'Africa/Banjul',
  BI: 'Africa/Bujumbura',
  MW: 'Africa/Blantyre',
  LS: 'Africa/Maseru',
  SZ: 'Africa/Mbabane',
  MU: 'Indian/Mauritius',
  SC: 'Indian/Mahe',
  CG: 'Africa/Brazzaville',
  GA: 'Africa/Libreville',
  CF: 'Africa/Bangui',
  SS: 'Africa/Juba',
  ER: 'Africa/Asmara',
  DJ: 'Africa/Djibouti',
  SO: 'Africa/Mogadishu',
  TD: 'Africa/Ndjamena',
  CV: 'Atlantic/Cape_Verde',
  GW: 'Africa/Bissau',
  GQ: 'Africa/Malabo',
  ST: 'Africa/Sao_Tome',
  KM: 'Indian/Comoro',
  LY: 'Africa/Tripoli',
  SD: 'Africa/Khartoum',
};

/**
 * Bridge languages offered alongside each market's local languages.
 * English is always included (Ghana pattern); FR/PT/AR/ES added where they are
 * administrative bridges.
 */
const BRIDGE_BY_MARKET: Record<string, string[]> = {
  ZA: ['en'],
  NG: ['en'],
  RW: ['en', 'fr'],
  ET: ['en'],
  KE: ['en'],
  UG: ['en'],
  ZW: ['en'],
  ZM: ['en'],
  TZ: ['en'],
  GH: ['en'],
  EG: ['en', 'ar'],
  MA: ['en', 'fr', 'ar'],
  DZ: ['en', 'fr', 'ar'],
  TN: ['en', 'fr', 'ar'],
  SN: ['en', 'fr'],
  CI: ['en', 'fr'],
  CM: ['en', 'fr'],
  CD: ['en', 'fr'],
  AO: ['en', 'pt'],
  MZ: ['en', 'pt'],
  BW: ['en'],
  NA: ['en'],
  MG: ['en', 'fr'],
  ML: ['en', 'fr'],
  BF: ['en', 'fr'],
  NE: ['en', 'fr'],
  GN: ['en', 'fr'],
  BJ: ['en', 'fr'],
  TG: ['en', 'fr'],
  LR: ['en'],
  SL: ['en'],
  GM: ['en'],
  BI: ['en', 'fr'],
  MW: ['en'],
  LS: ['en'],
  SZ: ['en'],
  MU: ['en', 'fr'],
  SC: ['en', 'fr'],
  CG: ['en', 'fr'],
  GA: ['en', 'fr'],
  CF: ['en', 'fr'],
  SS: ['en'],
  ER: ['en', 'ar'],
  DJ: ['en', 'fr', 'ar'],
  SO: ['en', 'ar'],
  TD: ['en', 'fr', 'ar'],
  CV: ['en', 'pt'],
  GW: ['en', 'pt'],
  GQ: ['en', 'es', 'fr'],
  ST: ['en', 'pt'],
  KM: ['en', 'fr', 'ar'],
  LY: ['en', 'ar'],
  SD: ['en', 'ar'],
};

/**
 * Approximate scheduled-session rate per 15 minutes in ISO minor units.
 * Manual-invoice estimates only — not live FX or payroll rates.
 */
export const RATE_PER_15_MIN_MINOR: Record<string, number> = {
  GHS: 9000,
  NGN: 2_500_000,
  ZAR: 45_000,
  KES: 500_000,
  TZS: 8_000_000,
  UGX: 15_000, // 0-decimal currency: store whole shillings
  RWF: 5_000, // 0-decimal
  ETB: 200_000,
  ZMW: 80_000,
  USD: 1_500,
  EGP: 150_000,
  MAD: 3_000,
  DZD: 4_000_00,
  TND: 8_000,
  XOF: 2_500_00,
  XAF: 2_500_00,
  CDF: 8_000_00,
  AOA: 3_000_00,
  MZN: 200_00,
  BWP: 40_000,
  NAD: 45_000,
  MGA: 15_000, // 0-decimal-ish practical
  GNF: 50_000, // 0-decimal
  LRD: 600_00,
  SLE: 80_00,
  GMD: 200_00,
  BIF: 8_000, // 0-decimal
  MWK: 5_000_00,
  LSL: 45_000,
  SZL: 45_000,
  MUR: 150_00,
  SCR: 50_00,
  SSP: 3_000,
  ERN: 50_00,
  DJF: 600, // 0-decimal
  SOS: 2_000_00,
  CVE: 30_000,
  STN: 80_00,
  KMF: 150_000,
  LYD: 20_00,
  SDG: 2_000_00,
};

export type AfricanMarket = {
  code: string;
  nameEn: string;
  region: string;
  currencyCode: string;
  timezone: string;
  bridgeLanguages: string[];
  localLanguages: string[];
};

export function africanMarkets(): AfricanMarket[] {
  const wanted = new Set<string>(AFRICAN_MARKET_CODES);
  return COUNTRY_PACK_SEEDS.filter((p) => wanted.has(p.code)).map((pack) => {
    const bridges = (BRIDGE_BY_MARKET[pack.code] ?? ['en']).filter((b) => LANGUAGE_BY_CODE.has(b));
    const locals = pack.primaryLanguages.filter(
      (l) => l !== 'en' && !bridges.includes(l) && LANGUAGE_BY_CODE.has(l),
    );
    // If a pack only lists a bridge (e.g. French-only), still expose that bridge as a workable language.
    const workingLocals =
      locals.length > 0
        ? locals
        : pack.primaryLanguages.filter((l) => LANGUAGE_BY_CODE.has(l) && l !== 'en');
    return {
      code: pack.code,
      nameEn: pack.nameEn,
      region: pack.region,
      currencyCode: pack.currencyCode,
      timezone: MARKET_TIMEZONES[pack.code] ?? 'UTC',
      bridgeLanguages: bridges.length ? bridges : ['en'],
      localLanguages: workingLocals,
    };
  });
}

export function languageLabel(code: string): string {
  if (code === 'ak') return 'Akan/Twi';
  if (code === 'rw') return 'Kinyarwanda';
  if (code === 'pcm') return 'Nigerian Pidgin';
  if (code === 'zu') return 'isiZulu';
  if (code === 'xh') return 'isiXhosa';
  if (code === 'st') return 'Sesotho';
  if (code === 'tn') return 'Setswana';
  if (code === 'sn') return 'Shona';
  if (code === 'nd') return 'Northern Ndebele';
  if (code === 'lg') return 'Luganda';
  if (code === 'ny') return 'Chichewa';
  if (code === 'bem') return 'Bemba';
  const hit = LANGUAGE_BY_CODE.get(code);
  return hit?.nameEn ?? code;
}

function pairNote(country: string): string {
  return `Scheduled general-business corridor for ${country}. Instant staffing and telephone bridging stay disabled without staffed supply evidence.`;
}

export type BuiltRelayCorridor = {
  id: string;
  label: string;
  sourceLanguage: string;
  targetLanguage: string;
  jurisdiction: string;
  timezone: string;
  currencyCode: string;
  domain: 'general_business';
  delivery: 'browser_audio';
  telephoneBridging: false;
  note: string;
  marketCode: string;
  marketName: string;
  region: string;
};

/** Historical Ghana ids preserved for existing clients/tests. */
const HISTORICAL_RELAY_IDS: Record<string, string> = {
  'ak-en-GH': 'ak-en-business',
  'en-ak-GH': 'en-ak-business',
};

export function buildRelayCorridors(): BuiltRelayCorridor[] {
  const out: BuiltRelayCorridor[] = [];
  const seen = new Set<string>();

  for (const market of africanMarkets()) {
    const langs = [...new Set([...market.localLanguages, ...market.bridgeLanguages])].filter(
      (l) => l !== 'en',
    );
    const bridges = market.bridgeLanguages.includes('en')
      ? ['en', ...market.bridgeLanguages.filter((b) => b !== 'en')]
      : market.bridgeLanguages;

    for (const local of langs) {
      for (const bridge of bridges) {
        if (local === bridge) continue;
        // Prefer local↔English first; also local↔French/Portuguese/Arabic where those are bridges.
        const directions: Array<[string, string]> = [
          [local, bridge],
          [bridge, local],
        ];
        for (const [source, target] of directions) {
          const histKey = `${source}-${target}-${market.code}`;
          const id =
            HISTORICAL_RELAY_IDS[histKey] ??
            `${source}-${target}-business-${market.code.toLowerCase()}`;
          if (seen.has(id)) continue;
          seen.add(id);
          out.push({
            id,
            label: `${languageLabel(source)} ↔ ${languageLabel(target)} · general business (${market.nameEn})`,
            sourceLanguage: source,
            targetLanguage: target,
            jurisdiction: market.code,
            timezone: market.timezone,
            currencyCode: market.currencyCode,
            domain: 'general_business',
            delivery: 'browser_audio',
            telephoneBridging: false,
            note: pairNote(market.nameEn),
            marketCode: market.code,
            marketName: market.nameEn,
            region: market.region,
          });
        }
      }
    }
  }

  return out;
}

export type BuiltEverydayCorridor = {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  label: string;
  ocr: boolean;
  faithfulTranslation: boolean;
  explanation: boolean;
  groundedQa: boolean;
  tts: boolean;
  reply: boolean;
  note: string;
  marketCode: string;
  marketName: string;
  region: string;
};

const HISTORICAL_EVERYDAY_IDS = new Set(['en-ak', 'ak-en', 'en-ee', 'ee-en', 'en-fr', 'fr-en']);

export function buildEverydayCorridors(): BuiltEverydayCorridor[] {
  const out: BuiltEverydayCorridor[] = [];
  const seen = new Set<string>();

  // Keep legacy FR administrative corridor even when not tied to one market.
  const legacy: BuiltEverydayCorridor[] = [
    {
      id: 'en-fr',
      sourceLanguage: 'en',
      targetLanguage: 'fr',
      label: 'English → French',
      ocr: true,
      faithfulTranslation: true,
      explanation: true,
      groundedQa: true,
      tts: true,
      reply: true,
      note: 'Administrative bilingual corridor.',
      marketCode: 'XX',
      marketName: 'Pan-African / administrative',
      region: 'Africa',
    },
    {
      id: 'fr-en',
      sourceLanguage: 'fr',
      targetLanguage: 'en',
      label: 'French → English',
      ocr: true,
      faithfulTranslation: true,
      explanation: true,
      groundedQa: true,
      tts: true,
      reply: true,
      note: 'Reverse bilingual corridor.',
      marketCode: 'XX',
      marketName: 'Pan-African / administrative',
      region: 'Africa',
    },
  ];
  for (const c of legacy) {
    seen.add(c.id);
    out.push(c);
  }

  for (const market of africanMarkets()) {
    const locals = [...new Set([...market.localLanguages, ...market.bridgeLanguages])].filter(
      (l) => LANGUAGE_BY_CODE.has(l),
    );
    const bridges = market.bridgeLanguages.filter((b) => LANGUAGE_BY_CODE.has(b));
    for (const local of locals) {
      for (const bridge of bridges) {
        if (local === bridge) continue;
        for (const [source, target] of [
          [bridge, local],
          [local, bridge],
        ] as const) {
          let id = `${source}-${target}`;
          if (seen.has(id) && !HISTORICAL_EVERYDAY_IDS.has(id)) {
            id = `${source}-${target}-${market.code.toLowerCase()}`;
          } else if (seen.has(id) && HISTORICAL_EVERYDAY_IDS.has(id)) {
            // Ghana ak/ee already covered; skip duplicate for GH.
            if (market.code === 'GH' && (local === 'ak' || local === 'ee') && bridge === 'en') {
              continue;
            }
            id = `${source}-${target}-${market.code.toLowerCase()}`;
          }
          if (seen.has(id)) continue;
          seen.add(id);
          out.push({
            id,
            sourceLanguage: source,
            targetLanguage: target,
            label: `${languageLabel(source)} → ${languageLabel(target)} (${market.nameEn})`,
            ocr: true,
            faithfulTranslation: true,
            explanation: true,
            groundedQa: true,
            tts: true,
            reply: true,
            note: `Private document pipeline for ${market.nameEn}. Adapter failures stay explicit; fixtures only when allowed.`,
            marketCode: market.code,
            marketName: market.nameEn,
            region: market.region,
          });
        }
      }
    }
  }

  return out;
}

export type BuiltLearnBackCorridor = {
  id: string;
  explanationLanguage: string;
  practiceLanguage: string;
  label: string;
  situations: Array<
    'job_interview' | 'customer_service' | 'school_meeting' | 'workplace_conversation'
  >;
  tts: boolean;
  asr: boolean;
  pronunciation: boolean;
  note: string;
  marketCode: string;
  marketName: string;
  region: string;
};

const HISTORICAL_LEARNBACK = new Set([
  'ak-en-interview',
  'en-ak-interview',
  'en-fr-interview',
  'fr-en-interview',
  'ak-en-customer',
  'en-ak-school',
]);

export function buildLearnBackCorridors(): BuiltLearnBackCorridor[] {
  const out: BuiltLearnBackCorridor[] = [];
  const seen = new Set<string>();

  const push = (c: BuiltLearnBackCorridor) => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    out.push(c);
  };

  // Preserve Ghana + FR historical corridors with richer situations.
  push({
    id: 'ak-en-interview',
    explanationLanguage: 'ak',
    practiceLanguage: 'en',
    label: 'Twi/Akan explanations · English interview practice (Ghana)',
    situations: ['job_interview'],
    tts: true,
    asr: true,
    pronunciation: false,
    note: 'Adult interview practice. Pronunciation stays not_assessed until LEARNBACK_PRONUNCIATION=1.',
    marketCode: 'GH',
    marketName: 'Ghana',
    region: 'West Africa',
  });
  push({
    id: 'en-ak-interview',
    explanationLanguage: 'en',
    practiceLanguage: 'ak',
    label: 'English explanations · Akan/Twi interview practice (Ghana)',
    situations: ['job_interview'],
    tts: true,
    asr: true,
    pronunciation: false,
    note: 'Practice answers in Akan/Twi with English feedback.',
    marketCode: 'GH',
    marketName: 'Ghana',
    region: 'West Africa',
  });
  push({
    id: 'ak-en-customer',
    explanationLanguage: 'ak',
    practiceLanguage: 'en',
    label: 'Twi/Akan explanations · English customer service (Ghana)',
    situations: ['customer_service'],
    tts: true,
    asr: true,
    pronunciation: false,
    note: 'Customer-service scenarios with the same privacy and evaluation contracts.',
    marketCode: 'GH',
    marketName: 'Ghana',
    region: 'West Africa',
  });
  push({
    id: 'en-ak-school',
    explanationLanguage: 'en',
    practiceLanguage: 'ak',
    label: 'English explanations · Akan/Twi school meeting (Ghana)',
    situations: ['school_meeting'],
    tts: true,
    asr: true,
    pronunciation: false,
    note: 'School-meeting practice; not professional advice.',
    marketCode: 'GH',
    marketName: 'Ghana',
    region: 'West Africa',
  });
  push({
    id: 'en-fr-interview',
    explanationLanguage: 'en',
    practiceLanguage: 'fr',
    label: 'English explanations · French interview practice',
    situations: ['job_interview', 'workplace_conversation'],
    tts: true,
    asr: true,
    pronunciation: false,
    note: 'Bilingual interview corridor. Pronunciation gated.',
    marketCode: 'XX',
    marketName: 'Pan-African / administrative',
    region: 'Africa',
  });
  push({
    id: 'fr-en-interview',
    explanationLanguage: 'fr',
    practiceLanguage: 'en',
    label: 'French explanations · English interview practice',
    situations: ['job_interview', 'workplace_conversation'],
    tts: true,
    asr: true,
    pronunciation: false,
    note: 'Bilingual interview corridor. Pronunciation gated.',
    marketCode: 'XX',
    marketName: 'Pan-African / administrative',
    region: 'Africa',
  });

  for (const market of africanMarkets()) {
    const locals = market.localLanguages.filter((l) => LANGUAGE_BY_CODE.has(l));
    const bridges = market.bridgeLanguages.filter((b) => LANGUAGE_BY_CODE.has(b));
    for (const local of locals) {
      for (const bridge of bridges) {
        if (local === bridge) continue;
        for (const [explanation, practice] of [
          [local, bridge],
          [bridge, local],
        ] as const) {
          let id = `${explanation}-${practice}-interview`;
          if (seen.has(id) && HISTORICAL_LEARNBACK.has(id)) {
            if (market.code === 'GH' && local === 'ak' && bridge === 'en') continue;
            id = `${explanation}-${practice}-interview-${market.code.toLowerCase()}`;
          } else if (seen.has(id)) {
            id = `${explanation}-${practice}-interview-${market.code.toLowerCase()}`;
          }
          push({
            id,
            explanationLanguage: explanation,
            practiceLanguage: practice,
            label: `${languageLabel(explanation)} explanations · ${languageLabel(practice)} interview practice (${market.nameEn})`,
            situations: ['job_interview', 'workplace_conversation'],
            tts: true,
            asr: true,
            pronunciation: false,
            note: `Adult practice for ${market.nameEn}. Pronunciation stays not_assessed without a validated assessor. Regional English varieties are not marked wrong for non-US/UK accent.`,
            marketCode: market.code,
            marketName: market.nameEn,
            region: market.region,
          });
        }
      }
    }
  }

  return out;
}

export type GeneratedScenarioSeed = {
  packKey: string;
  revision: string;
  situation: string;
  corridorId: string;
  levelLabel: string;
  questionText: string;
  questionExplanation: string;
  intent: string;
  targetSkills: string[];
  followUpPrompts: string[];
  exampleAnswers: string[];
  phraseExamples: { phrase: string; meaning: string }[];
  rubricVersion: string;
  reviewerNote: string;
};

/** Template interview packs for every generated LearnBack corridor (honest localization). */
export function buildLearnBackMarketScenarioSeeds(
  corridors: BuiltLearnBackCorridor[],
): GeneratedScenarioSeed[] {
  const seeds: GeneratedScenarioSeed[] = [];
  for (const c of corridors) {
    if (HISTORICAL_LEARNBACK.has(c.id)) continue; // hand-authored packs already cover these
    if (!c.situations.includes('job_interview')) continue;
    const practice = languageLabel(c.practiceLanguage);
    const explanation = languageLabel(c.explanationLanguage);
    seeds.push({
      packKey: `interview_problem_solving_${c.id}`,
      revision: 'interview_problem_solving_market_v1',
      situation: 'job_interview',
      corridorId: c.id,
      levelLabel: 'self_selected_beginner_to_intermediate',
      questionText:
        c.practiceLanguage === 'en'
          ? 'Tell me about a time you solved a problem at work or school.'
          : c.practiceLanguage === 'fr'
            ? 'Parlez-moi d’un problème que vous avez résolu au travail ou à l’école.'
            : c.practiceLanguage === 'pt'
              ? 'Conte-me sobre um problema que você resolveu no trabalho ou na escola.'
              : c.practiceLanguage === 'ar'
                ? 'أخبرني عن مرة حللت فيها مشكلة في العمل أو المدرسة.'
                : `Tell me about a time you solved a problem at work or school. (Answer in ${practice}.)`,
      questionExplanation:
        c.explanationLanguage === 'en'
          ? `Give one concrete story in ${practice}: the problem, your action, and the result. Keep your real facts — do not invent achievements.`
          : c.explanationLanguage === 'fr'
            ? `Donnez une histoire concrète en ${practice}: le problème, votre action et le résultat. Gardez vos faits réels.`
            : `Explain the intent in ${explanation}: one concrete problem, action, and result while practising ${practice}. Localization adapters may supply fuller ${explanation} text when available; otherwise this English intent stands.`,
      intent: 'share_one_concrete_problem_action_result',
      targetSkills: ['relevance', 'completeness', 'organization'],
      followUpPrompts: ['What was the problem?', 'What did you do?', 'What changed afterward?'],
      exampleAnswers: [
        'At my last job, our delivery list was wrong. I checked the orders, fixed two mistakes, and told my supervisor. The customer received the correct items the next day.',
      ],
      phraseExamples: [
        { phrase: 'I identified the issue', meaning: `Useful phrase while practising ${practice}` },
        { phrase: 'I took responsibility', meaning: `Useful phrase while practising ${practice}` },
      ],
      rubricVersion: 'interview_v1',
      reviewerNote: `Generated market pack for ${c.marketName} (${c.id}). Template content for adult practice — not hiring advice. Educator-reviewed localizations may replace templates over time.`,
    });
  }
  return seeds;
}

export function quoteRateForCurrency(currencyCode: string): number {
  return RATE_PER_15_MIN_MINOR[currencyCode] ?? RATE_PER_15_MIN_MINOR.USD ?? 1500;
}

export function africanMarketSummaries() {
  return africanMarkets().map((m) => ({
    code: m.code,
    nameEn: m.nameEn,
    region: m.region,
    currencyCode: m.currencyCode,
    timezone: m.timezone,
    bridgeLanguages: m.bridgeLanguages,
    localLanguages: m.localLanguages,
    localLanguageLabels: m.localLanguages.map(languageLabel),
  }));
}
