import { baseTtsLanguage } from '../gateway/native-voice';
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
  'own:en-us-female': { personality: 'warm', ageGroup: 'adult', dialect: 'en_us', accent: 'General American', region: 'United States', country: 'US', ethnicContext: 'American English', toneStyles: ['professional', 'customer_support', 'calm'] },
  'own:en-us-male': { personality: 'clear', ageGroup: 'adult', dialect: 'en_us', accent: 'General American', region: 'United States', country: 'US', ethnicContext: 'American English', toneStyles: ['professional', 'confident'] },
  'own:en-gb-female': { personality: 'warm', ageGroup: 'adult', dialect: 'en_gb', accent: 'Southern British English', region: 'United Kingdom', country: 'GB', ethnicContext: 'British English', toneStyles: ['professional', 'calm', 'empathetic'] },
  'own:en-gb-male': { personality: 'formal', ageGroup: 'adult', dialect: 'en_gb', accent: 'Southern British English', region: 'United Kingdom', country: 'GB', ethnicContext: 'British English', toneStyles: ['professional', 'legal'] },
  'own:en-ca-female': { personality: 'warm', ageGroup: 'adult', dialect: 'en_ca', accent: 'Canadian English', region: 'Canada', country: 'CA', ethnicContext: 'Canadian English', toneStyles: ['professional', 'customer_support'] },
  'own:en-ca-male': { personality: 'steady', ageGroup: 'adult', dialect: 'en_ca', accent: 'Canadian English', region: 'Canada', country: 'CA', ethnicContext: 'Canadian English', toneStyles: ['professional', 'calm'] },
  'own:en-au-female': { personality: 'bright', ageGroup: 'adult', dialect: 'en_au', accent: 'General Australian', region: 'Australia', country: 'AU', ethnicContext: 'Australian English', toneStyles: ['happy', 'customer_support'] },
  'own:en-au-male': { personality: 'relaxed', ageGroup: 'adult', dialect: 'en_au', accent: 'General Australian', region: 'Australia', country: 'AU', ethnicContext: 'Australian English', toneStyles: ['professional', 'confident'] },
  'own:en-nz-female': { personality: 'warm', ageGroup: 'adult', dialect: 'en_nz', accent: 'New Zealand English', region: 'New Zealand', country: 'NZ', ethnicContext: 'New Zealand English', toneStyles: ['empathetic', 'calm'] },
  'own:en-nz-male': { personality: 'steady', ageGroup: 'adult', dialect: 'en_nz', accent: 'New Zealand English', region: 'New Zealand', country: 'NZ', ethnicContext: 'New Zealand English', toneStyles: ['professional', 'calm'] },
  'own:en-kofi': { personality: 'professional', ageGroup: 'adult', dialect: 'en_west_africa', accent: 'Ghanaian English', region: 'Accra', country: 'GH', ethnicContext: 'Ghanaian English (Akan-influenced)', toneStyles: ['professional', 'customer_support'] },
  'own:en-gh-female': { personality: 'warm', ageGroup: 'adult', dialect: 'ghanaian_english', accent: 'Ghanaian English', region: 'Accra', country: 'GH', ethnicContext: 'Ghanaian English · Accra professional', toneStyles: ['professional', 'customer_support', 'empathetic'] },
  'own:en-gh-male': { personality: 'clear', ageGroup: 'adult', dialect: 'ghanaian_english', accent: 'Ghanaian English', region: 'Accra', country: 'GH', ethnicContext: 'Ghanaian English / Pidgin-aware', toneStyles: ['professional', 'confident'] },
  'own:en-ng-female': { personality: 'warm', ageGroup: 'adult', dialect: 'nigerian_english', accent: 'Nigerian English', region: 'Lagos', country: 'NG', ethnicContext: 'Nigerian English · Lagos / Abuja broadcast', toneStyles: ['professional', 'customer_support', 'sales'] },
  'own:en-ng-male': { personality: 'confident', ageGroup: 'adult', dialect: 'nigerian_english', accent: 'Nigerian English', region: 'Lagos', country: 'NG', ethnicContext: 'Nigerian English · Yoruba-aware', toneStyles: ['professional', 'confident', 'sales'] },
  'own:en-ph-female': { personality: 'warm', ageGroup: 'adult', dialect: 'filipino_english', accent: 'Filipino English', region: 'Manila', country: 'PH', ethnicContext: 'Filipino English · BPO / care · po/opo', toneStyles: ['empathetic', 'customer_support', 'calm'] },
  'own:en-ph-male': { personality: 'clear', ageGroup: 'adult', dialect: 'filipino_english', accent: 'Filipino English', region: 'Manila', country: 'PH', ethnicContext: 'Filipino English · Visayas-aware', toneStyles: ['professional', 'customer_support'] },
  'own:en-za-female': { personality: 'bright', ageGroup: 'adult', dialect: 'south_african_english', accent: 'South African English', region: 'Johannesburg', country: 'ZA', ethnicContext: 'South African English · rainbow nation', toneStyles: ['empathetic', 'customer_support', 'happy'] },
  'own:en-za-male': { personality: 'steady', ageGroup: 'adult', dialect: 'south_african_english', accent: 'South African English', region: 'Johannesburg', country: 'ZA', ethnicContext: 'South African English · township-aware', toneStyles: ['professional', 'calm'] },
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
    if (filters.language) {
      const wanted = baseTtsLanguage(filters.language);
      if (!v.languages.some((l) => baseTtsLanguage(l) === wanted)) return false;
    }
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
