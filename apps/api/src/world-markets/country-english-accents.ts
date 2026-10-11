import type { AccentIdentitySeed } from '../accents/accent-identity-seeds';
import type { WorldProductRegion } from './region-defs';

/**
 * Country-identifying English accents for LATAM / SEA / Middle East / Anglosphere.
 * English is a universal bridge; each market keeps its own variety.
 */

export type CountryEnglishAccent = {
  marketCode: string;
  marketName: string;
  region: string;
  worldRegion: WorldProductRegion;
  nameEn: string;
  bcp47: string;
  accentCode: string;
  dialectCode: string;
  accentIdentityId: string;
  speechVariety: string;
  echoVoiceId: string;
  echoModelVariant: string;
  culturalIdentity: string;
  identityProfile: string;
  pronunciationMarkers: string[];
  samplePhrase: string;
  lifestyleTags: string[];
  voiceProvisioning: 'dedicated' | 'nearest_world_english';
};

type MarketInput = {
  code: string;
  nameEn: string;
  region: string;
  worldRegion: WorldProductRegion;
};

type AccentOverride = Partial<
  Omit<
    CountryEnglishAccent,
    'marketCode' | 'bcp47' | 'accentCode' | 'dialectCode' | 'accentIdentityId' | 'worldRegion'
  >
> & { demonym: string };

const CURATED: Record<string, AccentOverride> = {
  PH: {
    demonym: 'Filipino',
    nameEn: 'Filipino English',
    speechVariety: 'filipino_english',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-ph-english',
    culturalIdentity: 'Filipino English · Manila BPO / care · Po/opo respect',
    identityProfile:
      'Filipino English — Tagalog substrate, Spanish loanwords, American schooling. Distinct from US/UK and from other SEA Englishes.',
    pronunciationMarkers: ['po', 'opo', 'already', 'for a while', 'salamat po'],
    samplePhrase:
      'Good morning po! I am already here for a while. Salamat po — shall we start now?',
    lifestyleTags: ['manila_bpo', 'po_opo_respect', 'sea_english'],
    voiceProvisioning: 'dedicated',
  },
  SG: {
    demonym: 'Singaporean',
    nameEn: 'Singaporean English',
    speechVariety: 'singaporean_english',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-sg-english',
    culturalIdentity: 'Singaporean English · Multilingual city-state · Standard vs Singlish',
    identityProfile:
      'Singaporean English — formal Standard Singapore English for product/business; distinct from Malaysian English and from colloquial Singlish.',
    pronunciationMarkers: ['can', 'lah', 'please', 'already', 'okay'],
    samplePhrase: 'Good morning. Can we start already? Please take a seat — okay, thank you.',
    lifestyleTags: ['singapore_professional', 'sea_english', 'multilingual_sg'],
    voiceProvisioning: 'nearest_world_english',
  },
  MY: {
    demonym: 'Malaysian',
    nameEn: 'Malaysian English',
    speechVariety: 'malaysian_english',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-my-english',
    culturalIdentity: 'Malaysian English · KL professional · Malay contact',
    identityProfile:
      'Malaysian English — Kuala Lumpur professional and schooling. Distinct from Singaporean English; Malay and Tamil contact influence.',
    pronunciationMarkers: ['lah', 'can', 'please', 'already', 'thank you'],
    samplePhrase: 'Good morning. Please sit — can we start? Thank you, lah.',
    lifestyleTags: ['kl_professional', 'sea_english', 'malay_contact'],
    voiceProvisioning: 'nearest_world_english',
  },
  ID: {
    demonym: 'Indonesian',
    nameEn: 'Indonesian English',
    speechVariety: 'indonesian_english',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-id-english',
    culturalIdentity: 'Indonesian English · Jakarta professional · Bahasa contact',
    identityProfile:
      'Indonesian English — Jakarta and national media. Bahasa Indonesia substrate; not interchangeable with Malaysian or Filipino English.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'yes', 'already'],
    samplePhrase: 'Good morning. Please take a seat — thank you. We can begin now.',
    lifestyleTags: ['jakarta_professional', 'sea_english', 'bahasa_contact'],
    voiceProvisioning: 'nearest_world_english',
  },
  TH: {
    demonym: 'Thai',
    nameEn: 'Thai English',
    speechVariety: 'thai_english',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-th-english',
    culturalIdentity: 'Thai English · Bangkok professional · Polite particles',
    identityProfile:
      'Thai English — Bangkok business and tourism. Thai polite particles and rhythm influence English; distinct SEA variety.',
    pronunciationMarkers: ['please', 'khrap', 'kha', 'thank you', 'okay'],
    samplePhrase: 'Good morning. Please sit — thank you. We can start the meeting now.',
    lifestyleTags: ['bangkok_professional', 'sea_english', 'thai_politeness'],
    voiceProvisioning: 'nearest_world_english',
  },
  VN: {
    demonym: 'Vietnamese',
    nameEn: 'Vietnamese English',
    speechVariety: 'vietnamese_english',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-vn-english',
    culturalIdentity: 'Vietnamese English · Hanoi / Saigon professional',
    identityProfile:
      'Vietnamese English — Hanoi and Ho Chi Minh City professional speech. Tone-language substrate shapes rhythm; distinct from other SEA Englishes.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'yes', 'already'],
    samplePhrase: 'Good morning. Please take a seat. Thank you — we can begin now.',
    lifestyleTags: ['vietnam_professional', 'sea_english'],
    voiceProvisioning: 'nearest_world_english',
  },
  MX: {
    demonym: 'Mexican',
    nameEn: 'Mexican English',
    speechVariety: 'mexican_english',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-mx-english',
    culturalIdentity: 'Mexican English · Mexico City professional · Spanish contact',
    identityProfile:
      'Mexican English — Mexico City and border professional contexts. Spanish contact influence; not US English and not interchangeable with other LATAM Englishes.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'of course', 'yes'],
    samplePhrase: 'Good morning. Please sit — of course, we can start. Thank you.',
    lifestyleTags: ['mexico_city_professional', 'latam_english', 'spanish_contact'],
    voiceProvisioning: 'nearest_world_english',
  },
  BR: {
    demonym: 'Brazilian',
    nameEn: 'Brazilian English',
    speechVariety: 'brazilian_english',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-br-english',
    culturalIdentity: 'Brazilian English · São Paulo / Rio professional · Portuguese contact',
    identityProfile:
      'Brazilian English — São Paulo and Rio professional speech. Portuguese substrate; distinct from other LATAM Englishes.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'yes', 'already'],
    samplePhrase: 'Good morning. Please take a seat — thank you. We can begin now.',
    lifestyleTags: ['sao_paulo_professional', 'latam_english', 'portuguese_contact'],
    voiceProvisioning: 'nearest_world_english',
  },
  AR: {
    demonym: 'Argentine',
    nameEn: 'Argentine English',
    speechVariety: 'argentine_english',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-ar-english',
    culturalIdentity: 'Argentine English · Buenos Aires · Rioplatense contact',
    identityProfile:
      'Argentine English — Buenos Aires professional contexts with Rioplatense Spanish contact; distinct Southern Cone variety.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'yes', 'of course'],
    samplePhrase: 'Good morning. Please sit — of course. Thank you, we can start.',
    lifestyleTags: ['buenos_aires_professional', 'latam_english', 'rioplatense_contact'],
    voiceProvisioning: 'nearest_world_english',
  },
  CO: {
    demonym: 'Colombian',
    nameEn: 'Colombian English',
    speechVariety: 'colombian_english',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-co-english',
    culturalIdentity: 'Colombian English · Bogotá professional · Andean Spanish contact',
    identityProfile:
      'Colombian English — Bogotá media and business. Andean Spanish contact; clear, careful register often noted in LATAM English.',
    pronunciationMarkers: ['please', 'thank you', 'with pleasure', 'okay', 'yes'],
    samplePhrase: 'Good morning. Please take a seat — with pleasure. Thank you.',
    lifestyleTags: ['bogota_professional', 'latam_english', 'andean_spanish'],
    voiceProvisioning: 'nearest_world_english',
  },
  JM: {
    demonym: 'Jamaican',
    nameEn: 'Jamaican English',
    speechVariety: 'jamaican_english',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-jm-english',
    culturalIdentity: 'Jamaican English · Kingston · Distinct from Patwa',
    identityProfile:
      'Jamaican English — Kingston professional and media. Distinct from Jamaican Patwa/Creole and from US/UK English.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'iried', 'yes'],
    samplePhrase: 'Good morning. Please sit — thank you. We can start the meeting now.',
    lifestyleTags: ['kingston_professional', 'caribbean_english'],
    voiceProvisioning: 'nearest_world_english',
  },
  SA: {
    demonym: 'Saudi',
    nameEn: 'Saudi English',
    speechVariety: 'saudi_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-sa-english',
    culturalIdentity: 'Saudi English · Riyadh / Jeddah professional · Arabic contact',
    identityProfile:
      'Saudi English — Riyadh and Jeddah business contexts. Arabic substrate and Gulf hospitality register; not US/UK English.',
    pronunciationMarkers: ['please', 'thank you', 'inshallah', 'okay', 'welcome'],
    samplePhrase: 'Welcome. Please take a seat — thank you. We can begin, inshallah.',
    lifestyleTags: ['riyadh_professional', 'gulf_english', 'arabic_contact'],
    voiceProvisioning: 'nearest_world_english',
  },
  AE: {
    demonym: 'Emirati',
    nameEn: 'Emirati English',
    speechVariety: 'emirati_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-ae-english',
    culturalIdentity: 'Emirati English · Dubai / Abu Dhabi · Multilingual Gulf',
    identityProfile:
      'Emirati English — Dubai and Abu Dhabi professional speech in a highly multilingual Gulf context; distinct from Saudi and Levantine Englishes.',
    pronunciationMarkers: ['please', 'thank you', 'welcome', 'okay', 'yes'],
    samplePhrase: 'Welcome. Please sit — thank you. We can start the briefing now.',
    lifestyleTags: ['dubai_professional', 'gulf_english', 'multilingual_gulf'],
    voiceProvisioning: 'nearest_world_english',
  },
  IQ: {
    demonym: 'Iraqi',
    nameEn: 'Iraqi English',
    speechVariety: 'iraqi_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-iq-english',
    culturalIdentity: 'Iraqi English · Baghdad · Mesopotamian Arabic contact',
    identityProfile:
      'Iraqi English — Baghdad professional and NGO contexts. Mesopotamian Arabic contact; distinct from Gulf and Levantine Englishes.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'welcome', 'yes'],
    samplePhrase: 'Welcome. Please take a seat — thank you. We can begin now.',
    lifestyleTags: ['baghdad_professional', 'mena_english', 'iraqi_arabic_contact'],
    voiceProvisioning: 'nearest_world_english',
  },
  LB: {
    demonym: 'Lebanese',
    nameEn: 'Lebanese English',
    speechVariety: 'lebanese_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-lb-english',
    culturalIdentity: 'Lebanese English · Beirut · Trilingual Arabic/French/English',
    identityProfile:
      'Lebanese English — Beirut business speech alongside Levantine Arabic and French; distinct Levantine English variety.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'yalla', 'welcome'],
    samplePhrase: 'Welcome. Please sit — yalla, we can start. Thank you.',
    lifestyleTags: ['beirut_professional', 'levantine_english', 'trilingual_lb'],
    voiceProvisioning: 'nearest_world_english',
  },
  IL: {
    demonym: 'Israeli',
    nameEn: 'Israeli English',
    speechVariety: 'israeli_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-il-english',
    culturalIdentity: 'Israeli English · Tel Aviv · Hebrew contact',
    identityProfile:
      'Israeli English — Tel Aviv professional speech with Hebrew substrate; direct register common; distinct from other MENA Englishes.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'yes', 'nu'],
    samplePhrase: 'Good morning. Please sit — okay, we can start. Thank you.',
    lifestyleTags: ['tel_aviv_professional', 'mena_english', 'hebrew_contact'],
    voiceProvisioning: 'nearest_world_english',
  },
  TR: {
    demonym: 'Turkish',
    nameEn: 'Turkish English',
    speechVariety: 'turkish_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-tr-english',
    culturalIdentity: 'Turkish English · Istanbul professional · Turkish contact',
    identityProfile:
      'Turkish English — Istanbul business speech. Turkish substrate; not interchangeable with Gulf or Levantine Englishes.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'yes', 'efendim'],
    samplePhrase: 'Good morning. Please take a seat — thank you. We can begin now.',
    lifestyleTags: ['istanbul_professional', 'mena_english', 'turkish_contact'],
    voiceProvisioning: 'nearest_world_english',
  },
  IR: {
    demonym: 'Iranian',
    nameEn: 'Iranian English',
    speechVariety: 'iranian_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-ir-english',
    culturalIdentity: 'Iranian English · Tehran · Persian contact',
    identityProfile:
      'Iranian English — Tehran professional and academic speech. Persian (Farsi) substrate and taarof-influenced politeness in English.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'yes', 'welcome'],
    samplePhrase: 'Welcome. Please sit — thank you. We can begin the discussion now.',
    lifestyleTags: ['tehran_professional', 'mena_english', 'persian_contact'],
    voiceProvisioning: 'nearest_world_english',
  },
  US: {
    demonym: 'American',
    nameEn: 'American English',
    speechVariety: 'american_english',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-us-english',
    culturalIdentity: 'American English · General American broadcast · Multi-ethnic',
    identityProfile:
      'General American English — broadcast and professional baseline. Distinct from British, Canadian, Australian, and New Zealand Englishes; regional and ethnic varieties (Southern, AAVE, Chicano English contact) are separate identity packs.',
    pronunciationMarkers: ['yeah', 'okay', 'awesome', 'got it', 'sure thing'],
    samplePhrase: 'Hey, yeah — okay, awesome! Got it. Sure thing, we can start now.',
    lifestyleTags: ['general_american', 'anglosphere_english', 'us_broadcast'],
    voiceProvisioning: 'nearest_world_english',
  },
  CA: {
    demonym: 'Canadian',
    nameEn: 'Canadian English',
    speechVariety: 'canadian_english',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-ca-english',
    culturalIdentity: 'Canadian English · Toronto / national media · Distinct from US',
    identityProfile:
      'Canadian English — national media and professional speech. Canadian raising and lexical markers (eh, toque, washroom); not interchangeable with General American.',
    pronunciationMarkers: ['eh', 'sorry', 'washroom', 'toque', 'about'],
    samplePhrase: 'Good morning. Sorry — shall we start? The washroom is down the hall, eh.',
    lifestyleTags: ['canadian_english', 'anglosphere_english', 'canadian_raising'],
    voiceProvisioning: 'nearest_world_english',
  },
  AU: {
    demonym: 'Australian',
    nameEn: 'Australian English',
    speechVariety: 'australian_english',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-au-english',
    culturalIdentity: 'Australian English · National broadcast · Distinct vowel system',
    identityProfile:
      'Australian English — Sydney/Melbourne national media. Distinct vowel system and lexicon (arvo, mate, no worries); not British or New Zealand English.',
    pronunciationMarkers: ['mate', 'arvo', 'no worries', 'reckon', 'yeah nah'],
    samplePhrase: 'G’day mate. No worries — we can start this arvo. Reckon we’re ready.',
    lifestyleTags: ['australian_english', 'anglosphere_english', 'aussie_broadcast'],
    voiceProvisioning: 'nearest_world_english',
  },
  NZ: {
    demonym: 'New Zealand',
    nameEn: 'New Zealand English',
    speechVariety: 'new_zealand_english',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-nz-english',
    culturalIdentity: 'New Zealand English · Aotearoa · Māori contact',
    identityProfile:
      'New Zealand English — national media with Māori loanwords (kia ora, whānau). Distinct from Australian English; vowel shifts identify NZ speakers.',
    pronunciationMarkers: ['kia ora', 'sweet as', 'yeah nah', 'bro', 'chur'],
    samplePhrase: 'Kia ora. Sweet as — we can start now. Yeah nah, we’re ready.',
    lifestyleTags: ['new_zealand_english', 'anglosphere_english', 'maori_loans'],
    voiceProvisioning: 'nearest_world_english',
  },
  GB: {
    demonym: 'British',
    nameEn: 'British English',
    speechVariety: 'british_english',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-gb-english',
    culturalIdentity: 'British English · UK national / RP-influenced · Multi-nation',
    identityProfile:
      'British English — UK professional and media baseline. Distinct from American, Canadian, Australian, and Irish Englishes; Scottish, Welsh, and Northern English are separate cultural varieties.',
    pronunciationMarkers: ['cheers', 'brilliant', 'quite', 'rather', 'mate'],
    samplePhrase: 'Cheers! Brilliant — shall we crack on? Quite straightforward, really.',
    lifestyleTags: ['british_english', 'anglosphere_english', 'uk_broadcast'],
    voiceProvisioning: 'nearest_world_english',
  },
  IE: {
    demonym: 'Irish',
    nameEn: 'Irish English',
    speechVariety: 'irish_english',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-ie-english',
    culturalIdentity: 'Irish English · Dublin / national · Distinct from British',
    identityProfile:
      'Irish English — Dublin and national media. Distinct from British English; Hiberno-English syntax and lexicon (grand, yer man) identify Irish speakers.',
    pronunciationMarkers: ['grand', 'yer man', 'sure', 'thanks a million', 'deadly'],
    samplePhrase: 'How’s it going? Grand — sure we can start now. Thanks a million.',
    lifestyleTags: ['irish_english', 'anglosphere_english', 'hiberno_english'],
    voiceProvisioning: 'nearest_world_english',
  },
};

/** Hand-authored identity ids that must not be duplicated by generators. */
export const HAND_AUTHORED_WORLD_ENGLISH_IDS: Record<string, string> = {
  PH: 'ph-filipino-english',
  US: 'us-general-american',
  GB: 'gb-british',
};

const DEMONYMS: Record<string, string> = {
  MX: 'Mexican',
  BR: 'Brazilian',
  AR: 'Argentine',
  CL: 'Chilean',
  CO: 'Colombian',
  PE: 'Peruvian',
  VE: 'Venezuelan',
  EC: 'Ecuadorian',
  BO: 'Bolivian',
  PY: 'Paraguayan',
  UY: 'Uruguayan',
  CR: 'Costa Rican',
  PA: 'Panamanian',
  GT: 'Guatemalan',
  HN: 'Honduran',
  SV: 'Salvadoran',
  NI: 'Nicaraguan',
  CU: 'Cuban',
  DO: 'Dominican',
  PR: 'Puerto Rican',
  HT: 'Haitian',
  JM: 'Jamaican',
  TT: 'Trinidadian',
  GY: 'Guyanese',
  BZ: 'Belizean',
  SR: 'Surinamese',
  PH: 'Filipino',
  ID: 'Indonesian',
  TH: 'Thai',
  VN: 'Vietnamese',
  MY: 'Malaysian',
  SG: 'Singaporean',
  KH: 'Cambodian',
  LA: 'Lao',
  MM: 'Myanmar',
  BN: 'Bruneian',
  TL: 'Timorese',
  SA: 'Saudi',
  AE: 'Emirati',
  QA: 'Qatari',
  KW: 'Kuwaiti',
  BH: 'Bahraini',
  OM: 'Omani',
  IQ: 'Iraqi',
  IR: 'Iranian',
  IL: 'Israeli',
  JO: 'Jordanian',
  LB: 'Lebanese',
  SY: 'Syrian',
  YE: 'Yemeni',
  PS: 'Palestinian',
  TR: 'Turkish',
  US: 'American',
  CA: 'Canadian',
  AU: 'Australian',
  NZ: 'New Zealand',
  GB: 'British',
  IE: 'Irish',
};

const REGION_VOICE: Record<string, string> = {
  latam: 'own:en-ph-female',
  sea: 'own:en-ph-female',
  mena: 'own:en-ke-female',
  anglosphere: 'own:en-kofi',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function demonymFor(code: string, marketName: string): string {
  if (DEMONYMS[code]) return DEMONYMS[code]!;
  if (marketName.endsWith('a')) return `${marketName}n`;
  if (marketName.endsWith('o')) return `${marketName.slice(0, -1)}an`;
  if (marketName.endsWith('y')) return `${marketName.slice(0, -1)}ian`;
  return `${marketName}an`;
}

export function buildCountryEnglishAccent(market: MarketInput): CountryEnglishAccent {
  const curated = CURATED[market.code];
  const demonym = curated?.demonym ?? demonymFor(market.code, market.nameEn);
  const nameEn = curated?.nameEn ?? `${demonym} English`;
  const cc = market.code.toLowerCase();
  const nearest = REGION_VOICE[market.worldRegion] ?? 'own:en-ph-female';
  const echoVoiceId = curated?.echoVoiceId ?? nearest;
  const dedicated = curated?.voiceProvisioning === 'dedicated';
  const handId = HAND_AUTHORED_WORLD_ENGLISH_IDS[market.code];

  return {
    marketCode: market.code,
    marketName: market.nameEn,
    region: market.region,
    worldRegion: market.worldRegion,
    nameEn,
    bcp47: `en-${market.code}`,
    accentCode: `en-${cc}`,
    dialectCode: `en-${cc}`,
    accentIdentityId: handId ?? `${cc}-${slugify(nameEn)}`,
    speechVariety: curated?.speechVariety ?? slugify(nameEn),
    echoVoiceId,
    echoModelVariant: curated?.echoModelVariant ?? `lugemi-echo-voice-${cc}-english`,
    culturalIdentity:
      curated?.culturalIdentity ??
      `${nameEn} · ${market.nameEn} professional · Country-identifying`,
    identityProfile:
      curated?.identityProfile ??
      `${nameEn} — professional, media, and classroom speech in ${market.nameEn}. Country-identifying English variety; not interchangeable with US/UK English or other regional Englishes.`,
    pronunciationMarkers: curated?.pronunciationMarkers ?? [
      'please',
      'thank you',
      'okay',
      'kindly',
    ],
    samplePhrase:
      curated?.samplePhrase ??
      `Good morning. Welcome — please take a seat. We can begin in ${nameEn} now.`,
    lifestyleTags: curated?.lifestyleTags ?? [
      `${cc}_professional`,
      `${market.worldRegion}_english`,
      slugify(market.region),
    ],
    voiceProvisioning: dedicated ? 'dedicated' : 'nearest_world_english',
  };
}

export function buildCountryEnglishAccentIdentitySeeds(
  markets: MarketInput[],
  existingIds: Set<string>,
): AccentIdentitySeed[] {
  const seeds: AccentIdentitySeed[] = [];
  for (const market of markets) {
    if (HAND_AUTHORED_WORLD_ENGLISH_IDS[market.code]) continue;
    const accent = buildCountryEnglishAccent(market);
    if (existingIds.has(accent.accentIdentityId)) continue;
    seeds.push({
      id: accent.accentIdentityId,
      nameEn: accent.nameEn,
      languageCode: 'en',
      country: accent.marketCode,
      regionTags: [accent.marketName, accent.region, accent.nameEn, accent.worldRegion],
      accentCode: accent.accentCode,
      dialectCode: accent.dialectCode,
      identityProfile: accent.identityProfile,
      pronunciationMarkers: accent.pronunciationMarkers,
      samplePhrase: accent.samplePhrase,
      echoVoiceId: accent.echoVoiceId,
      echoModelVariant: accent.echoModelVariant,
      bcp47: accent.bcp47,
      culturalIdentity: accent.culturalIdentity,
      speechVariety: accent.speechVariety,
      lifestyleTags: accent.lifestyleTags,
    });
  }
  return seeds;
}

export function worldCulturalEnglishDefaults(
  accents: CountryEnglishAccent[],
): Record<string, { accentIdentityId: string; speechVariety: string; echoVoiceId: string }> {
  const out: Record<
    string,
    { accentIdentityId: string; speechVariety: string; echoVoiceId: string }
  > = {};
  for (const accent of accents) {
    out[accent.bcp47] = {
      accentIdentityId: accent.accentIdentityId,
      speechVariety: accent.speechVariety,
      echoVoiceId: accent.echoVoiceId,
    };
  }
  return out;
}
