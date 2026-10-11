import type { AccentIdentitySeed } from '../accents/accent-identity-seeds';

/**
 * Country-identifying English accents for African markets.
 * English is a universal bridge, but each market has its own English
 * variety — never route African English as generic US/UK.
 */

export type AfricanEnglishAccent = {
  marketCode: string;
  marketName: string;
  region: string;
  /** Human label listeners use to identify the country, e.g. "Nigerian English". */
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
  /** Closest staffed Echo voice when a dedicated country voice is not yet provisioned. */
  voiceProvisioning: 'dedicated' | 'nearest_african_english';
};

type MarketInput = { code: string; nameEn: string; region: string };

type AccentOverride = Partial<
  Omit<AfricanEnglishAccent, 'marketCode' | 'bcp47' | 'accentCode' | 'dialectCode' | 'accentIdentityId'>
> & {
  demonym: string;
};

const CURATED: Record<string, AccentOverride> = {
  GH: {
    demonym: 'Ghanaian',
    nameEn: 'Ghanaian English',
    speechVariety: 'ghanaian_english',
    echoVoiceId: 'own:en-gh-female',
    echoModelVariant: 'lugemi-echo-voice-gh-english',
    culturalIdentity: 'Ghanaian English · Accra professional · Akan etiquette',
    identityProfile:
      'Standard Ghanaian English — Accra and Kumasi professional, media, and classroom speech. Akan-influenced rhythm and polite register; listeners hear Ghanaian lifestyle without Pidgin slang.',
    pronunciationMarkers: ['please', 'somehow', 'at all', 'you are welcome', 'small'],
    samplePhrase:
      'Good morning. You are welcome — somehow we can start now. Please, take your time; we will finish at all before lunch.',
    lifestyleTags: ['accra_professional', 'akan_etiquette', 'west_african_english', 'church_and_market'],
    voiceProvisioning: 'dedicated',
  },
  NG: {
    demonym: 'Nigerian',
    nameEn: 'Nigerian English',
    speechVariety: 'nigerian_english',
    echoVoiceId: 'own:en-ng-female',
    echoModelVariant: 'lugemi-echo-voice-ng-english',
    culturalIdentity: 'Nigerian English · Lagos / Abuja broadcast · Naija lifestyle',
    identityProfile:
      'Standard Nigerian English — Lagos, Abuja, and national media. Distinct from Pidgin and from UK/US English; listeners hear Naija lifestyle without requiring ethnic substrate markers.',
    pronunciationMarkers: ['how far', 'abeg', 'oya', 'na wa', 'sharp'],
    samplePhrase:
      'Good afternoon. How far — shall we start? Abeg, take your seat; we will be sharp with the agenda.',
    lifestyleTags: ['lagos_professional', 'naija_english', 'west_african_english', 'media_broadcast'],
    voiceProvisioning: 'dedicated',
  },
  ZA: {
    demonym: 'South African',
    nameEn: 'South African English',
    speechVariety: 'south_african_english',
    echoVoiceId: 'own:en-za-female',
    echoModelVariant: 'lugemi-echo-voice-za-english',
    culturalIdentity: 'South African English · National broadcast · Rainbow lifestyle',
    identityProfile:
      'General South African English — Johannesburg, Cape Town, and national broadcast. Distinct vowel system and lexical markers (howzit, robot, just now).',
    pronunciationMarkers: ['howzit', 'robot', 'just now', 'sharp', 'eish'],
    samplePhrase:
      'Howzit. Just now we can start — the robot is clear. Sharp, let us begin the meeting.',
    lifestyleTags: ['rainbow_nation', 'southern_african_english', 'broadcast_sae'],
    voiceProvisioning: 'dedicated',
  },
  KE: {
    demonym: 'Kenyan',
    nameEn: 'Kenyan English',
    speechVariety: 'kenyan_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-ke-english',
    culturalIdentity: 'Kenyan English · Nairobi professional · Swahili loans',
    identityProfile:
      'Kenyan English — Bantu-influenced rhythm, British schooling legacy. Pole, sasa, and hakuna are common loanwords in English sentences.',
    pronunciationMarkers: ['pole', 'sasa', 'hakuna', 'please', 'kindly'],
    samplePhrase:
      'Sasa, kindly take a seat. Pole for the delay — we can start now. Hakuna shida.',
    lifestyleTags: ['nairobi_professional', 'east_african_english', 'swahili_loans'],
    voiceProvisioning: 'dedicated',
  },
  TZ: {
    demonym: 'Tanzanian',
    nameEn: 'Tanzanian English',
    speechVariety: 'tanzanian_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-tz-english',
    culturalIdentity: 'Tanzanian English · Dar es Salaam · Coastal Swahili influence',
    identityProfile:
      'Tanzanian English — Dar es Salaam and national schooling. Strong coastal Swahili influence on rhythm and polite address; distinct from Kenyan English.',
    pronunciationMarkers: ['karibu', 'asante', 'tafadhali', 'kindly', 'please'],
    samplePhrase:
      'Karibu. Tafadhali, take your seat. Asante — we can begin the discussion now.',
    lifestyleTags: ['dar_professional', 'east_african_english', 'coastal_swahili'],
    voiceProvisioning: 'nearest_african_english',
  },
  UG: {
    demonym: 'Ugandan',
    nameEn: 'Ugandan English',
    speechVariety: 'ugandan_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-ug-english',
    culturalIdentity: 'Ugandan English · Kampala professional · Luganda influence',
    identityProfile:
      'Ugandan English — Kampala media and administration. Luganda and other local languages color rhythm; not interchangeable with Kenyan or Tanzanian English.',
    pronunciationMarkers: ['please', 'kindly', 'you people', 'somehow', 'okay please'],
    samplePhrase:
      'You are welcome. Kindly sit — somehow we can start. Okay please, let us proceed.',
    lifestyleTags: ['kampala_professional', 'east_african_english', 'luganda_influence'],
    voiceProvisioning: 'nearest_african_english',
  },
  RW: {
    demonym: 'Rwandan',
    nameEn: 'Rwandan English',
    speechVariety: 'rwandan_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-rw-english',
    culturalIdentity: 'Rwandan English · Kigali professional · Trilingual context',
    identityProfile:
      'Rwandan English — Kigali business and government. Spoken alongside Kinyarwanda and French; careful, inclusive register shaped by national reconciliation culture.',
    pronunciationMarkers: ['please', 'kindly', 'thank you', 'together', 'we can'],
    samplePhrase: 'Good morning. Thank you for coming — kindly, we can begin together.',
    lifestyleTags: ['kigali_professional', 'east_african_english', 'trilingual_rwanda'],
    voiceProvisioning: 'nearest_african_english',
  },
  ET: {
    demonym: 'Ethiopian',
    nameEn: 'Ethiopian English',
    speechVariety: 'ethiopian_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-et-english',
    culturalIdentity: 'Ethiopian English · Addis Ababa · Amharic influence',
    identityProfile:
      'Ethiopian English — Addis Ababa professional and academic speech. Amharic substrate affects rhythm and consonant clusters; distinct from East African coastal English.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'yes please', 'we will'],
    samplePhrase:
      'Good morning. Thank you — please, we will start the meeting now. Yes please, take a seat.',
    lifestyleTags: ['addis_professional', 'horn_of_africa_english', 'amharic_influence'],
    voiceProvisioning: 'nearest_african_english',
  },
  ZW: {
    demonym: 'Zimbabwean',
    nameEn: 'Zimbabwean English',
    speechVariety: 'zimbabwean_english',
    echoVoiceId: 'own:en-za-female',
    echoModelVariant: 'lugemi-echo-voice-zw-english',
    culturalIdentity: 'Zimbabwean English · Harare professional · Shona/Ndebele influence',
    identityProfile:
      'Zimbabwean English — Harare and Bulawayo. Shona and Northern Ndebele influence rhythm; British schooling legacy without South African SAE vowels.',
    pronunciationMarkers: ['please', 'sharp', 'just now', 'how are you', 'thank you'],
    samplePhrase:
      'How are you. Please sit — just now we can begin. Sharp, thank you for coming.',
    lifestyleTags: ['harare_professional', 'southern_african_english', 'shona_ndebele'],
    voiceProvisioning: 'nearest_african_english',
  },
  ZM: {
    demonym: 'Zambian',
    nameEn: 'Zambian English',
    speechVariety: 'zambian_english',
    echoVoiceId: 'own:en-za-female',
    echoModelVariant: 'lugemi-echo-voice-zm-english',
    culturalIdentity: 'Zambian English · Lusaka professional · Bemba/Nyanja influence',
    identityProfile:
      'Zambian English — Lusaka media and administration. Bemba and Nyanja influence polite address; distinct from Zimbabwean and South African English.',
    pronunciationMarkers: ['please', 'kindly', 'bwana', 'thank you', 'okay'],
    samplePhrase:
      'You are welcome. Kindly sit — thank you. We can start the discussion now.',
    lifestyleTags: ['lusaka_professional', 'southern_african_english', 'bemba_nyanja'],
    voiceProvisioning: 'nearest_african_english',
  },
  CM: {
    demonym: 'Cameroonian',
    nameEn: 'Cameroonian English',
    speechVariety: 'cameroonian_english',
    echoVoiceId: 'own:en-ng-female',
    echoModelVariant: 'lugemi-echo-voice-cm-english',
    culturalIdentity: 'Cameroonian English · Douala / Yaoundé · Anglophone regions',
    identityProfile:
      'Cameroonian English — Anglophone Northwest/Southwest and urban bilingual contexts. Distinct from Nigerian English and from Cameroonian Pidgin.',
    pronunciationMarkers: ['please', 'na', 'how far', 'we go', 'okay'],
    samplePhrase:
      'Good morning. Please, we can start — how far, are you ready for the agenda?',
    lifestyleTags: ['anglophone_cameroon', 'central_african_english', 'bilingual_cm'],
    voiceProvisioning: 'nearest_african_english',
  },
  LR: {
    demonym: 'Liberian',
    nameEn: 'Liberian English',
    speechVariety: 'liberian_english',
    echoVoiceId: 'own:en-gh-female',
    echoModelVariant: 'lugemi-echo-voice-lr-english',
    culturalIdentity: 'Liberian English · Monrovia · Americo-Liberian legacy',
    identityProfile:
      'Liberian English — Monrovia professional speech with Americo-Liberian historical influence; distinct from Ghanaian and Nigerian English.',
    pronunciationMarkers: ['yah', 'please', 'small', 'okay', 'fine'],
    samplePhrase: 'Yah, good morning. Please sit — we can start small, then finish the agenda.',
    lifestyleTags: ['monrovia_professional', 'west_african_english', 'americo_liberian'],
    voiceProvisioning: 'nearest_african_english',
  },
  SL: {
    demonym: 'Sierra Leonean',
    nameEn: 'Sierra Leonean English',
    speechVariety: 'sierra_leonean_english',
    echoVoiceId: 'own:en-gh-female',
    echoModelVariant: 'lugemi-echo-voice-sl-english',
    culturalIdentity: 'Sierra Leonean English · Freetown · Krio contact',
    identityProfile:
      'Sierra Leonean English — Freetown administration and media. Strong Krio contact influence; not the same as Nigerian or Ghanaian English.',
    pronunciationMarkers: ['please', 'how di body', 'okay', 'small', 'fine'],
    samplePhrase: 'Good morning. How di body — please, we can start the meeting now.',
    lifestyleTags: ['freetown_professional', 'west_african_english', 'krio_contact'],
    voiceProvisioning: 'nearest_african_english',
  },
  BW: {
    demonym: 'Botswana',
    nameEn: 'Botswana English',
    speechVariety: 'botswana_english',
    echoVoiceId: 'own:en-za-female',
    echoModelVariant: 'lugemi-echo-voice-bw-english',
    culturalIdentity: 'Botswana English · Gaborone · Setswana influence',
    identityProfile:
      'Botswana English — Gaborone professional speech with Setswana polite forms; distinct Southern African variety.',
    pronunciationMarkers: ['please', 'dumela', 'thank you', 'okay', 'sharp'],
    samplePhrase: 'Dumela. Please take a seat — thank you. We can begin now.',
    lifestyleTags: ['gaborone_professional', 'southern_african_english', 'setswana'],
    voiceProvisioning: 'nearest_african_english',
  },
  NA: {
    demonym: 'Namibian',
    nameEn: 'Namibian English',
    speechVariety: 'namibian_english',
    echoVoiceId: 'own:en-za-female',
    echoModelVariant: 'lugemi-echo-voice-na-english',
    culturalIdentity: 'Namibian English · Windhoek · Multilingual contact',
    identityProfile:
      'Namibian English — Windhoek business speech in contact with Afrikaans, Oshiwambo, and German legacy; not identical to South African English.',
    pronunciationMarkers: ['please', 'howzit', 'okay', 'thank you', 'sharp'],
    samplePhrase: 'Good morning. Please sit — howzit, we can start the briefing now.',
    lifestyleTags: ['windhoek_professional', 'southern_african_english', 'multilingual_na'],
    voiceProvisioning: 'nearest_african_english',
  },
  MW: {
    demonym: 'Malawian',
    nameEn: 'Malawian English',
    speechVariety: 'malawian_english',
    echoVoiceId: 'own:en-za-female',
    echoModelVariant: 'lugemi-echo-voice-mw-english',
    culturalIdentity: 'Malawian English · Lilongwe · Chichewa influence',
    identityProfile:
      'Malawian English — Lilongwe and Blantyre. Chichewa influence on rhythm and polite address.',
    pronunciationMarkers: ['please', 'thank you', 'ziku bwanji', 'okay', 'kindly'],
    samplePhrase: 'Good morning. Ziku bwanji — please sit. Thank you, we can begin.',
    lifestyleTags: ['lilongwe_professional', 'east_african_english', 'chichewa'],
    voiceProvisioning: 'nearest_african_english',
  },
  SS: {
    demonym: 'South Sudanese',
    nameEn: 'South Sudanese English',
    speechVariety: 'south_sudanese_english',
    echoVoiceId: 'own:en-ke-female',
    echoModelVariant: 'lugemi-echo-voice-ss-english',
    culturalIdentity: 'South Sudanese English · Juba · Multilingual Nile basin',
    identityProfile:
      'South Sudanese English — Juba administration and NGO contexts. Multilingual Nile-basin contact; distinct from Kenyan and Ugandan English.',
    pronunciationMarkers: ['please', 'thank you', 'okay', 'we can', 'kindly'],
    samplePhrase: 'Good morning. Please, thank you for coming — we can start the meeting.',
    lifestyleTags: ['juba_professional', 'east_african_english', 'nile_basin'],
    voiceProvisioning: 'nearest_african_english',
  },
};

const DEMONYMS: Record<string, string> = {
  GH: 'Ghanaian',
  NG: 'Nigerian',
  ZA: 'South African',
  KE: 'Kenyan',
  TZ: 'Tanzanian',
  UG: 'Ugandan',
  RW: 'Rwandan',
  ET: 'Ethiopian',
  ZW: 'Zimbabwean',
  ZM: 'Zambian',
  EG: 'Egyptian',
  MA: 'Moroccan',
  DZ: 'Algerian',
  TN: 'Tunisian',
  SN: 'Senegalese',
  CI: 'Ivorian',
  CM: 'Cameroonian',
  CD: 'Congolese',
  AO: 'Angolan',
  MZ: 'Mozambican',
  BW: 'Botswana',
  NA: 'Namibian',
  MG: 'Malagasy',
  ML: 'Malian',
  BF: 'Burkinabé',
  NE: 'Nigerien',
  GN: 'Guinean',
  BJ: 'Beninese',
  TG: 'Togolese',
  LR: 'Liberian',
  SL: 'Sierra Leonean',
  GM: 'Gambian',
  BI: 'Burundian',
  MW: 'Malawian',
  LS: 'Basotho',
  SZ: 'Swazi',
  MU: 'Mauritian',
  SC: 'Seychellois',
  CG: 'Congolese',
  GA: 'Gabonese',
  CF: 'Central African',
  SS: 'South Sudanese',
  ER: 'Eritrean',
  DJ: 'Djiboutian',
  SO: 'Somali',
  TD: 'Chadian',
  CV: 'Cape Verdean',
  GW: 'Bissau-Guinean',
  GQ: 'Equatoguinean',
  ST: 'São Toméan',
  KM: 'Comorian',
  LY: 'Libyan',
  SD: 'Sudanese',
};

const REGION_VOICE: Record<string, string> = {
  'West Africa': 'own:en-gh-female',
  'East Africa': 'own:en-ke-female',
  'Southern Africa': 'own:en-za-female',
  'North Africa': 'own:en-ke-female',
  'Middle Africa': 'own:en-ng-female',
};

/** Hand-authored accent identity ids — do not duplicate generated seeds. */
export const HAND_AUTHORED_ENGLISH_IDENTITY_IDS: Record<string, string> = {
  GH: 'gh-ghanaian-english',
  NG: 'ng-nigerian-english',
  ZA: 'za-south-african-english',
  KE: 'ke-english',
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

export function buildAfricanEnglishAccent(market: MarketInput): AfricanEnglishAccent {
  const curated = CURATED[market.code];
  const demonym = curated?.demonym ?? demonymFor(market.code, market.nameEn);
  const nameEn = curated?.nameEn ?? `${demonym} English`;
  const cc = market.code.toLowerCase();
  const nearest = REGION_VOICE[market.region] ?? 'own:en-gh-female';
  const echoVoiceId = curated?.echoVoiceId ?? nearest;
  const dedicated = curated?.voiceProvisioning === 'dedicated';
  const handId = HAND_AUTHORED_ENGLISH_IDENTITY_IDS[market.code];

  return {
    marketCode: market.code,
    marketName: market.nameEn,
    region: market.region,
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
      `${nameEn} — professional, media, and classroom speech in ${market.nameEn}. Country-identifying English variety; not interchangeable with US/UK English or other African Englishes.`,
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
      'african_english',
      slugify(market.region),
    ],
    voiceProvisioning: dedicated ? 'dedicated' : 'nearest_african_english',
  };
}

export function buildAfricanEnglishAccents(markets: MarketInput[]): AfricanEnglishAccent[] {
  return markets.map(buildAfricanEnglishAccent);
}

/** Accent-identity seeds for markets without hand-authored English packs. */
export function buildAfricanEnglishAccentIdentitySeeds(
  markets: MarketInput[],
  existingIds: Set<string>,
): AccentIdentitySeed[] {
  const seeds: AccentIdentitySeed[] = [];
  for (const market of markets) {
    if (HAND_AUTHORED_ENGLISH_IDENTITY_IDS[market.code]) continue;
    const accent = buildAfricanEnglishAccent(market);
    if (existingIds.has(accent.accentIdentityId)) continue;
    seeds.push({
      id: accent.accentIdentityId,
      nameEn: accent.nameEn,
      languageCode: 'en',
      country: accent.marketCode,
      regionTags: [accent.marketName, accent.region, accent.nameEn],
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

export function africanCulturalEnglishDefaults(
  accents: AfricanEnglishAccent[],
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
