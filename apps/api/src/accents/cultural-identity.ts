/**
 * Cultural speech identity helpers for Lugemi Accent Identity packs.
 * Maps packs to speech varieties and lifestyle tags so TTS/STT/localize/chat
 * can prefer culturally native routing — independent of neural weight maturity.
 */

export type SpeechVariety =
  | 'ghanaian_english'
  | 'ghanaian_pidgin'
  | 'nigerian_english'
  | 'nigerian_pidgin'
  | 'yoruba_influenced_english'
  | 'igbo_influenced_english'
  | 'hausa_influenced_english'
  | 'filipino_english'
  | 'tagalog'
  | 'cebuano'
  | 'south_african_english'
  | 'zulu_influenced_english'
  | 'xhosa_influenced_english'
  | 'afrikaans_influenced_english'
  | 'township_english'
  | 'kenyan_english'
  | 'kenyan_swahili'
  | 'tanzanian_swahili'
  | 'senegalese_french'
  | 'ivorian_french'
  | 'egyptian_arabic'
  | 'gulf_arabic'
  | 'levantine_arabic'
  | 'amharic'
  | 'kinyarwanda'
  | 'angolan_portuguese'
  | 'brazilian_portuguese'
  | 'mexican_spanish'
  | 'british_english'
  | 'american_english'
  | 'cameroonian_pidgin'
  | 'central_thai'
  | 'northern_vietnamese'
  | 'malaysian_malay'
  | 'javanese'
  | 'haitian_creole'
  | 'akan_twi'
  | 'fante'
  | 'yoruba'
  | 'isizulu'
  | string;

/** Explicit speech_variety overrides for priority cultural English / Pidgin packs. */
export const SPEECH_VARIETY_BY_PACK_ID: Record<string, SpeechVariety> = {
  'gh-ghanaian-english': 'ghanaian_english',
  'gh-pidgin': 'ghanaian_pidgin',
  'gh-twi-asante': 'akan_twi',
  'gh-fante': 'fante',
  'ng-nigerian-english': 'nigerian_english',
  'ng-pidgin': 'nigerian_pidgin',
  'ng-yoruba-influence': 'yoruba_influenced_english',
  'ng-igbo-influence': 'igbo_influenced_english',
  'ng-hausa-influence': 'hausa_influenced_english',
  'ng-yoruba-native': 'yoruba',
  'ph-filipino-english': 'filipino_english',
  'ph-tagalog': 'tagalog',
  'ph-cebuano': 'cebuano',
  'za-south-african-english': 'south_african_english',
  'za-zulu-english': 'zulu_influenced_english',
  'za-xhosa-english': 'xhosa_influenced_english',
  'za-afrikaans-english': 'afrikaans_influenced_english',
  'za-township': 'township_english',
  'za-zulu-native': 'isizulu',
  'ke-english': 'kenyan_english',
  'ke-swahili-sheng': 'kenyan_swahili',
  'tz-swahili-coastal': 'tanzanian_swahili',
  'sn-wolof-french': 'senegalese_french',
  'ci-ivorian-french': 'ivorian_french',
  'eg-arabic': 'egyptian_arabic',
  'sa-gulf-arabic': 'gulf_arabic',
  'lb-levantine': 'levantine_arabic',
  'et-amharic': 'amharic',
  'rw-kinyarwanda': 'kinyarwanda',
  'ao-portuguese': 'angolan_portuguese',
  'br-portuguese': 'brazilian_portuguese',
  'mx-spanish': 'mexican_spanish',
  'gb-british': 'british_english',
  'us-general-american': 'american_english',
  'cm-pidgin': 'cameroonian_pidgin',
  'th-central': 'central_thai',
  'vn-hanoi': 'northern_vietnamese',
  'my-kuala-lumpur': 'malaysian_malay',
  'id-javanese': 'javanese',
  'ht-creole': 'haitian_creole',
};

/** Lifestyle / culture tags listeners associate with speech identity. */
export const LIFESTYLE_TAGS_BY_PACK_ID: Record<string, string[]> = {
  'gh-ghanaian-english': [
    'accra_professional',
    'akan_etiquette',
    'west_african_english',
    'church_and_market',
  ],
  'gh-pidgin': ['chale_street', 'urban_ghana', 'market_rhythm', 'cross_tribal'],
  'gh-twi-asante': ['ashanti', 'elder_honorifics', 'kumasi', 'akan'],
  'gh-fante': ['cape_coast', 'coastal_trading', 'fishing_communities'],
  'ng-nigerian-english': [
    'lagos_professional',
    'naija_english',
    'west_african_english',
    'media_broadcast',
  ],
  'ng-pidgin': ['naija', 'lagos_street', 'pan_ethnic', 'jollof_culture'],
  'ng-yoruba-influence': ['lagos', 'yoruba_honorifics', 'southwest_nigeria'],
  'ng-igbo-influence': ['southeast_nigeria', 'market_clarity', 'enugu'],
  'ng-hausa-influence': ['kano', 'islamic_greetings', 'northern_nigeria'],
  'ng-yoruba-native': ['tonal', 'ceremony', 'bilingual_education'],
  'ph-filipino-english': [
    'manila_bpo',
    'po_opo_respect',
    'nursing_diaspora',
    'tagalog_substrate',
  ],
  'ph-tagalog': ['manila', 'catholic_folk', 'national_filipino'],
  'ph-cebuano': ['visayas', 'sinulog', 'regional_pride'],
  'za-south-african-english': [
    'rainbow_nation',
    'howzit',
    'urban_professional',
    'southern_africa',
  ],
  'za-zulu-english': ['kwazulu_natal', 'ubuntu', 'durban'],
  'za-xhosa-english': ['eastern_cape', 'clan_identity', 'oral_tradition'],
  'za-afrikaans-english': ['western_cape', 'braai', 'cape_town'],
  'za-township': ['soweto', 'multilingual_mix', 'urban_youth'],
  'za-zulu-native': ['kzn_media', 'noun_classes', 'traditional'],
  'ke-english': ['nairobi_professional', 'british_schooling', 'swahili_loans'],
  'ke-swahili-sheng': ['nairobi_youth', 'sheng', 'urban_east_africa'],
};

export function deriveSpeechVariety(input: {
  id: string;
  nameEn: string;
  languageCode: string;
  country: string;
  dialectCode?: string;
}): SpeechVariety {
  const explicit = SPEECH_VARIETY_BY_PACK_ID[input.id];
  if (explicit) return explicit;

  const dialect = input.dialectCode?.toLowerCase() ?? '';
  if (dialect.includes('ghanaian-english') || dialect === 'en-gh-ghanaian-english') {
    return 'ghanaian_english';
  }
  if (dialect.includes('pidgin') && input.country === 'NG') return 'nigerian_pidgin';
  if (dialect.includes('pidgin') && input.country === 'GH') return 'ghanaian_pidgin';
  if (input.languageCode === 'en' && input.country === 'PH') return 'filipino_english';
  if (input.languageCode === 'en' && input.country === 'NG') return 'nigerian_english';
  if (input.languageCode === 'en' && input.country === 'GH') return 'ghanaian_english';
  if (input.languageCode === 'en' && input.country === 'ZA') return 'south_african_english';
  if (input.languageCode === 'en' && input.country === 'KE') return 'kenyan_english';
  if (input.languageCode === 'pcm') return 'nigerian_pidgin';

  const stem = input.nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return stem || `${input.languageCode}_${input.country.toLowerCase()}`;
}

export function deriveCulturalIdentityLabel(input: {
  nameEn: string;
  country: string;
  countryLabel?: string;
  regionTags: string[];
}): string {
  const place = input.countryLabel ?? input.country;
  const culture = input.regionTags.find(
    (t) =>
      !['West Africa', 'East Africa', 'Southern Africa', 'North Africa', 'Central Africa', 'Southeast Asia', 'MENA', 'Europe', 'North America', 'Latin America', 'Caribbean'].includes(
        t,
      ) && t !== place,
  );
  if (culture) return `${input.nameEn} · ${culture} · ${place}`;
  return `${input.nameEn} · ${place}`;
}

export function deriveLifestyleTags(input: {
  id: string;
  regionTags: string[];
  country: string;
  languageCode: string;
}): string[] {
  const explicit = LIFESTYLE_TAGS_BY_PACK_ID[input.id];
  if (explicit?.length) return explicit;

  const tags = new Set<string>();
  for (const t of input.regionTags) {
    tags.add(
      t
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, ''),
    );
  }
  tags.add(`country_${input.country.toLowerCase()}`);
  tags.add(`lang_${input.languageCode}`);
  return [...tags].filter(Boolean).slice(0, 8);
}

/** Prefer cultural English / Pidgin packs when localizing or synthesizing for these BCP-47 tags. */
export const CULTURAL_ENGLISH_BCP47_DEFAULTS: Record<
  string,
  { accentIdentityId: string; speechVariety: SpeechVariety; echoVoiceId: string }
> = {
  'en-GH': {
    accentIdentityId: 'gh-ghanaian-english',
    speechVariety: 'ghanaian_english',
    echoVoiceId: 'own:en-gh-female',
  },
  'en-NG': {
    accentIdentityId: 'ng-nigerian-english',
    speechVariety: 'nigerian_english',
    echoVoiceId: 'own:en-ng-female',
  },
  'en-PH': {
    accentIdentityId: 'ph-filipino-english',
    speechVariety: 'filipino_english',
    echoVoiceId: 'own:en-ph-female',
  },
  'en-ZA': {
    accentIdentityId: 'za-south-african-english',
    speechVariety: 'south_african_english',
    echoVoiceId: 'own:en-za-female',
  },
  'en-KE': {
    accentIdentityId: 'ke-english',
    speechVariety: 'kenyan_english',
    echoVoiceId: 'own:en-ke-female',
  },
  'pcm-NG': {
    accentIdentityId: 'ng-pidgin',
    speechVariety: 'nigerian_pidgin',
    echoVoiceId: 'own:pcm-ng-female',
  },
};
