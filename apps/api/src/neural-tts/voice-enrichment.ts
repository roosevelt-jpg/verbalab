import type { TtsVoice } from '../gateway/tts-provider';

export type EnrichedTtsVoice = TtsVoice & {
  personality: string;
  ageGroup: 'adult' | 'child' | 'unknown';
  dialect: string | null;
  accent: string | null;
  region: string | null;
  enterprise: boolean;
  category: 'stock' | 'own' | 'clone';
};

const ENRICHMENT: Record<
  string,
  Partial<Pick<EnrichedTtsVoice, 'personality' | 'ageGroup' | 'dialect' | 'accent' | 'region' | 'enterprise'>>
> = {
  alloy: { personality: 'balanced', ageGroup: 'adult', dialect: null, accent: 'general_american', region: 'us' },
  echo: { personality: 'clear', ageGroup: 'adult', dialect: null, accent: 'general_american', region: 'us' },
  fable: { personality: 'narrative', ageGroup: 'adult', dialect: 'british_literary', accent: 'received_pronunciation', region: 'gb' },
  onyx: { personality: 'deep', ageGroup: 'adult', dialect: null, accent: 'general_american', region: 'us' },
  nova: { personality: 'warm', ageGroup: 'adult', dialect: null, accent: 'general_american', region: 'us' },
  shimmer: { personality: 'bright', ageGroup: 'adult', dialect: null, accent: 'general_american', region: 'us' },
  'own:sw-aisha': {
    personality: 'warm',
    ageGroup: 'adult',
    dialect: 'swahili_coastal',
    accent: 'east_african',
    region: 'ke',
    enterprise: false,
  },
  'own:yo-tunde': {
    personality: 'formal',
    ageGroup: 'adult',
    dialect: 'yoruba_standard',
    accent: 'west_african',
    region: 'ng',
  },
  'own:am-hanna': {
    personality: 'calm',
    ageGroup: 'adult',
    dialect: 'amharic_standard',
    accent: 'ethiopian',
    region: 'et',
  },
  'own:en-kofi': {
    personality: 'professional',
    ageGroup: 'adult',
    dialect: 'en_west_africa',
    accent: 'ghanaian_english',
    region: 'gh',
  },
};

export function enrichVoice(voice: TtsVoice, opts?: { enterprise?: boolean; category?: EnrichedTtsVoice['category'] }): EnrichedTtsVoice {
  const extra = ENRICHMENT[voice.id] ?? {};
  const category =
    opts?.category ??
    (voice.id.startsWith('own:') ? 'own' : voice.id.startsWith('clone:') ? 'clone' : 'stock');
  return {
    ...voice,
    personality: extra.personality ?? 'neutral',
    ageGroup: extra.ageGroup ?? 'adult',
    dialect: extra.dialect ?? null,
    accent: extra.accent ?? null,
    region: extra.region ?? null,
    enterprise: opts?.enterprise ?? extra.enterprise ?? category === 'clone',
    category,
  };
}

export type VoiceListFilters = {
  gender?: string;
  language?: string;
  personality?: string;
  dialect?: string;
  accent?: string;
  category?: string;
  ageGroup?: string;
  enterprise?: string;
};

export function filterEnrichedVoices(voices: EnrichedTtsVoice[], filters: VoiceListFilters): EnrichedTtsVoice[] {
  return voices.filter((v) => {
    if (filters.gender && v.gender !== filters.gender) return false;
    if (filters.language && !v.languages.includes(filters.language)) return false;
    if (filters.personality && v.personality !== filters.personality) return false;
    if (filters.dialect && v.dialect !== filters.dialect) return false;
    if (filters.accent && v.accent !== filters.accent) return false;
    if (filters.category && v.category !== filters.category) return false;
    if (filters.ageGroup && v.ageGroup !== filters.ageGroup) return false;
    if (filters.enterprise === 'true' && !v.enterprise) return false;
    if (filters.enterprise === 'false' && v.enterprise) return false;
    return true;
  });
}
