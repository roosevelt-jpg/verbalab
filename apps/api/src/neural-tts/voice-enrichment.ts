import type { TtsVoice } from '../gateway/tts-provider';

export type EnrichedTtsVoice = TtsVoice & {
  personality: string;
  ageGroup: 'adult' | 'child' | 'unknown';
  dialect: string | null;
  accent: string | null;
  region: string | null;
  country: string | null;
  ethnicContext: string | null;
  toneStyles: string[];
  enterprise: boolean;
  category: 'stock' | 'own' | 'clone';
};

type Extra = Partial<
  Pick<
    EnrichedTtsVoice,
    | 'personality'
    | 'ageGroup'
    | 'dialect'
    | 'accent'
    | 'region'
    | 'country'
    | 'ethnicContext'
    | 'toneStyles'
    | 'enterprise'
  >
>;

const ENRICHMENT: Record<string, Extra> = {
  alloy: { personality: 'balanced', ageGroup: 'adult', dialect: null, accent: 'general_american', region: 'United States', country: 'US', toneStyles: ['professional', 'calm'] },
  echo: { personality: 'clear', ageGroup: 'adult', dialect: null, accent: 'general_american', region: 'United States', country: 'US', toneStyles: ['professional', 'medical'] },
  fable: { personality: 'narrative', ageGroup: 'adult', dialect: 'british_literary', accent: 'received_pronunciation', region: 'United Kingdom', country: 'GB', toneStyles: ['calm', 'empathetic'] },
  onyx: { personality: 'deep', ageGroup: 'adult', dialect: null, accent: 'general_american', region: 'United States', country: 'US', toneStyles: ['urgent', 'legal', 'assertive'] },
  nova: { personality: 'warm', ageGroup: 'adult', dialect: null, accent: 'general_american', region: 'United States', country: 'US', toneStyles: ['empathetic', 'customer_support', 'happy'] },
  shimmer: { personality: 'bright', ageGroup: 'adult', dialect: null, accent: 'general_american', region: 'United States', country: 'US', toneStyles: ['calm', 'sad'] },
  'own:sw-aisha': { personality: 'warm', ageGroup: 'adult', dialect: 'swahili_coastal', accent: 'Kenyan Swahili', region: 'Nairobi / Coast', country: 'KE', ethnicContext: 'Coastal & urban Kenyan Swahili', toneStyles: ['empathetic', 'customer_support', 'calm'] },
  'own:sw-ke-female': { personality: 'warm', ageGroup: 'adult', dialect: 'swahili_coastal', accent: 'Kenyan Swahili', region: 'Nairobi / Coast', country: 'KE', ethnicContext: 'Coastal & urban Kenyan Swahili', toneStyles: ['empathetic', 'customer_support', 'calm'] },
  'own:yo-tunde': { personality: 'formal', ageGroup: 'adult', dialect: 'yoruba_standard', accent: 'Lagos Yoruba', region: 'Lagos', country: 'NG', ethnicContext: 'Standard Lagos Yoruba', toneStyles: ['professional', 'sales', 'confident'] },
  'own:yo-ng-male': { personality: 'formal', ageGroup: 'adult', dialect: 'yoruba_standard', accent: 'Lagos Yoruba', region: 'Lagos', country: 'NG', ethnicContext: 'Standard Lagos Yoruba', toneStyles: ['professional', 'sales', 'confident'] },
  'own:am-hanna': { personality: 'calm', ageGroup: 'adult', dialect: 'amharic_standard', accent: 'Addis Ababa Amharic', region: 'Addis Ababa', country: 'ET', ethnicContext: 'Addis Ababa Amharic', toneStyles: ['calm', 'professional', 'empathetic'] },
  'own:am-et-female': { personality: 'calm', ageGroup: 'adult', dialect: 'amharic_standard', accent: 'Addis Ababa Amharic', region: 'Addis Ababa', country: 'ET', ethnicContext: 'Addis Ababa Amharic', toneStyles: ['calm', 'professional', 'empathetic'] },
  'own:en-kofi': { personality: 'professional', ageGroup: 'adult', dialect: 'en_west_africa', accent: 'Ghanaian English', region: 'Accra', country: 'GH', ethnicContext: 'Ghanaian English (Akan-influenced)', toneStyles: ['professional', 'customer_support'] },
  'own:zu-za-female': { personality: 'bright', ageGroup: 'adult', dialect: 'zulu_natal', accent: 'KwaZulu-Natal Zulu', region: 'Durban', country: 'ZA', ethnicContext: 'KwaZulu-Natal Zulu', toneStyles: ['empathetic', 'happy', 'customer_support'] },
  'own:ar-eg-male': { personality: 'clear', ageGroup: 'adult', dialect: 'egyptian_arabic', accent: 'Cairene Arabic', region: 'Cairo', country: 'EG', ethnicContext: 'Cairene Arabic', toneStyles: ['professional', 'sales', 'urgent'] },
  'own:fr-sn-female': { personality: 'warm', ageGroup: 'adult', dialect: 'senegalese_french', accent: 'Senegalese French', region: 'Dakar', country: 'SN', ethnicContext: 'Senegalese French (Wolof-influenced)', toneStyles: ['empathetic', 'calm', 'customer_support'] },
  'own:ha-ng-male': { personality: 'steady', ageGroup: 'adult', dialect: 'hausa_kano', accent: 'Kano Hausa', region: 'Kano', country: 'NG', ethnicContext: 'Northern Nigeria / Niger — Hausa', toneStyles: ['professional', 'calm', 'customer_support'] },
  'own:ak-gh-female': { personality: 'warm', ageGroup: 'adult', dialect: 'akan_twi', accent: 'Accra Twi', region: 'Accra', country: 'GH', ethnicContext: 'Akan / Twi (Ghana)', toneStyles: ['empathetic', 'customer_support', 'calm'] },
};

export function enrichVoice(
  voice: TtsVoice,
  opts?: { enterprise?: boolean; category?: EnrichedTtsVoice['category'] },
): EnrichedTtsVoice {
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
    country: extra.country ?? null,
    ethnicContext: extra.ethnicContext ?? null,
    toneStyles: extra.toneStyles ?? ['neutral'],
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
  region?: string;
  country?: string;
  category?: string;
  ageGroup?: string;
  enterprise?: string;
  toneStyle?: string;
};

export function filterEnrichedVoices(
  voices: EnrichedTtsVoice[],
  filters: VoiceListFilters,
): EnrichedTtsVoice[] {
  return voices.filter((v) => {
    if (filters.gender && v.gender !== filters.gender) return false;
    if (filters.language && !v.languages.includes(filters.language)) return false;
    if (filters.personality && v.personality !== filters.personality) return false;
    if (filters.dialect && v.dialect !== filters.dialect) return false;
    if (filters.accent && v.accent !== filters.accent) return false;
    if (filters.region && v.region !== filters.region) return false;
    if (filters.country && v.country !== filters.country) return false;
    if (filters.category && v.category !== filters.category) return false;
    if (filters.ageGroup && v.ageGroup !== filters.ageGroup) return false;
    if (filters.enterprise === 'true' && !v.enterprise) return false;
    if (filters.enterprise === 'false' && v.enterprise) return false;
    if (
      filters.toneStyle &&
      !v.toneStyles.map((t) => t.toLowerCase()).includes(filters.toneStyle.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}
