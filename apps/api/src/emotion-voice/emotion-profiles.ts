export type EmotionVoiceId =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fear'
  | 'excited'
  | 'professional'
  | 'calm'
  | 'urgent'
  | 'empathetic'
  | 'medical'
  | 'legal'
  | 'sales'
  | 'customer_support';

export type EmotionVoiceProfile = {
  id: EmotionVoiceId;
  name: string;
  category: 'emotion' | 'domain';
  description: string;
  /** Preferred stock / own voice when caller omits voice. */
  preferredVoice: string;
  /** Soft prosody transform mode — never injects spoken stage directions. */
  prosody: 'bright' | 'soft' | 'sharp' | 'tense' | 'energetic' | 'formal' | 'steady' | 'urgent' | 'warm';
  /** third-party TTS voice_settings when synthesizing clone:{id} (partial expressive control). */
  cloneStyle?: {
    stability: number;
    similarity_boost: number;
    style: number;
  };
};

export const EMOTION_VOICE_PROFILES: EmotionVoiceProfile[] = [
  {
    id: 'happy',
    name: 'Happy',
    category: 'emotion',
    description: 'Upbeat, warm delivery',
    preferredVoice: 'nova',
    prosody: 'bright',
    cloneStyle: { stability: 0.35, similarity_boost: 0.7, style: 0.55 },
  },
  {
    id: 'sad',
    name: 'Sad',
    category: 'emotion',
    description: 'Softer, slower cadence cues',
    preferredVoice: 'shimmer',
    prosody: 'soft',
    cloneStyle: { stability: 0.65, similarity_boost: 0.65, style: 0.25 },
  },
  {
    id: 'angry',
    name: 'Angry',
    category: 'emotion',
    description: 'Sharper phrasing cues',
    preferredVoice: 'onyx',
    prosody: 'sharp',
    cloneStyle: { stability: 0.3, similarity_boost: 0.75, style: 0.7 },
  },
  {
    id: 'fear',
    name: 'Fear',
    category: 'emotion',
    description: 'Tense, cautious cadence',
    preferredVoice: 'fable',
    prosody: 'tense',
    cloneStyle: { stability: 0.4, similarity_boost: 0.7, style: 0.45 },
  },
  {
    id: 'excited',
    name: 'Excited',
    category: 'emotion',
    description: 'Energetic emphasis',
    preferredVoice: 'alloy',
    prosody: 'energetic',
    cloneStyle: { stability: 0.25, similarity_boost: 0.7, style: 0.75 },
  },
  {
    id: 'professional',
    name: 'Professional',
    category: 'domain',
    description: 'Neutral business tone',
    preferredVoice: 'echo',
    prosody: 'formal',
    cloneStyle: { stability: 0.55, similarity_boost: 0.75, style: 0.15 },
  },
  {
    id: 'calm',
    name: 'Calm',
    category: 'emotion',
    description: 'Steady, measured delivery',
    preferredVoice: 'shimmer',
    prosody: 'steady',
    cloneStyle: { stability: 0.7, similarity_boost: 0.65, style: 0.1 },
  },
  {
    id: 'urgent',
    name: 'Urgent',
    category: 'emotion',
    description: 'Direct, time-sensitive cues',
    preferredVoice: 'onyx',
    prosody: 'urgent',
    cloneStyle: { stability: 0.35, similarity_boost: 0.8, style: 0.5 },
  },
  {
    id: 'empathetic',
    name: 'Empathetic',
    category: 'emotion',
    description: 'Warm, supportive tone',
    preferredVoice: 'nova',
    prosody: 'warm',
    cloneStyle: { stability: 0.55, similarity_boost: 0.7, style: 0.35 },
  },
  {
    id: 'medical',
    name: 'Medical',
    category: 'domain',
    description: 'Clear clinical register (disclaimer: not medical advice)',
    preferredVoice: 'echo',
    prosody: 'formal',
    cloneStyle: { stability: 0.6, similarity_boost: 0.8, style: 0.1 },
  },
  {
    id: 'legal',
    name: 'Legal',
    category: 'domain',
    description: 'Precise formal register',
    preferredVoice: 'onyx',
    prosody: 'formal',
    cloneStyle: { stability: 0.65, similarity_boost: 0.8, style: 0.05 },
  },
  {
    id: 'sales',
    name: 'Sales',
    category: 'domain',
    description: 'Persuasive, energetic commercial tone',
    preferredVoice: 'alloy',
    prosody: 'energetic',
    cloneStyle: { stability: 0.4, similarity_boost: 0.7, style: 0.55 },
  },
  {
    id: 'customer_support',
    name: 'Customer Support',
    category: 'domain',
    description: 'Helpful, calm service tone',
    preferredVoice: 'nova',
    prosody: 'warm',
    cloneStyle: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
  },
];

export function getEmotionProfile(id: string): EmotionVoiceProfile | undefined {
  return EMOTION_VOICE_PROFILES.find((p) => p.id === id);
}

/**
 * Soft punctuation / pacing cues only — never prepends spoken stage directions
 * like "say happily:" which would be audible.
 */
export function applySoftProsody(text: string, prosody: EmotionVoiceProfile['prosody']): string {
  const trimmed = text.trim;
  if (!trimmed) return trimmed;

  switch (prosody) {
    case 'bright':
    case 'energetic':
      return /[.!?]$/.test(trimmed) ? trimmed.replace(/\.$/, '!') : `${trimmed}!`;
    case 'soft':
    case 'steady':
    case 'warm':
      return trimmed
        .replace(/\.\s+/g, '... ')
        .replace(/\.\.\.\s*\.\.\./g, '... ');
    case 'sharp':
    case 'urgent':
      return trimmed.replace(/,\s+/g, '. ').replace(/\.\s+/g, '. ');
    case 'tense':
      return trimmed.replace(/\?\s*/g, '?... ').replace(/\.\s+/g, '... ');
    case 'formal':
    default:
      return trimmed;
  }
}
