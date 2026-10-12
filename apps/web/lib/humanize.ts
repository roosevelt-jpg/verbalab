/** Turn snake_case / kebab API codes into human labels for UI copy. */
export function humanizeLabel(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) return '';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function humanizeSpeechVariety(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) return '';
  const known: Record<string, string> = {
    ghanaian_english: 'Ghanaian English',
    nigerian_english: 'Nigerian English',
    nigerian_pidgin: 'Nigerian Pidgin',
    kenyan_english: 'Kenyan English',
    south_african_english: 'South African English',
    filipino_english: 'Filipino English',
    afghan_english: 'Afghan English',
    british_english: 'British English',
    american_english: 'American English',
    australian_english: 'Australian English',
    customer_support: 'Customer support',
    awaiting_provider: 'Awaiting provider',
  };
  const key = value.toLowerCase();
  return known[key] ?? humanizeLabel(value);
}

const MODEL_LABELS: Record<string, string> = {
  own_tts: 'Lugemi Echo TTS',
  espeak_demo: 'eSpeak demo',
  neural_kokoro: 'Neural Kokoro',
  neural_piper: 'Neural Piper',
  baobab_mt: 'Baobab translate',
  whisper_asr: 'Whisper speech recognition',
  creative_media: 'Creative media',
  voice_clone: 'Voice clone',
};

/** Human label for plan-included model / engine ids. */
export function humanizeModelId(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) return '';
  return MODEL_LABELS[value] ?? MODEL_LABELS[value.toLowerCase()] ?? humanizeLabel(value);
}
