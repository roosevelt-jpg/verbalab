export type TopUpProductKind = 'tts' | 'stt' | 'translate' | 'chat' | 'general';

export type TopUpPack = {
  id: string;
  name: string;
  productKind: TopUpProductKind;
  units: number;
  unitLabel: string;
  priceCents: number;
  priceLabel: string;
  blurb: string;
  stripePriceEnv?: string;
};

export const TOP_UP_PACKS: TopUpPack[] = [
  {
    id: 'topup_tts_100k',
    name: '100,000 Voice / TTS Characters',
    productKind: 'tts',
    units: 100_000,
    unitLabel: 'chars',
    priceCents: 1000, // $10
    priceLabel: '$10',
    blurb: 'Instant top-up for speech synthesis and voice turns when plan quota is exhausted.',
    stripePriceEnv: 'STRIPE_PRICE_ID_TOPUP_TTS_100K',
  },
  {
    id: 'topup_tts_500k',
    name: '500,000 Voice / TTS Characters',
    productKind: 'tts',
    units: 500_000,
    unitLabel: 'chars',
    priceCents: 4500, // $45
    priceLabel: '$45',
    blurb: 'High-volume character refill with 10% volume discount.',
    stripePriceEnv: 'STRIPE_PRICE_ID_TOPUP_TTS_500K',
  },
  {
    id: 'topup_stt_60m',
    name: '60 STT / Transcription Minutes',
    productKind: 'stt',
    units: 60,
    unitLabel: 'minutes',
    priceCents: 1200, // $12
    priceLabel: '$12',
    blurb: 'Extra hours of speech recognition and audio transcription.',
    stripePriceEnv: 'STRIPE_PRICE_ID_TOPUP_STT_60M',
  },
  {
    id: 'topup_translate_200k',
    name: '200,000 Translation Characters',
    productKind: 'translate',
    units: 200_000,
    unitLabel: 'chars',
    priceCents: 1500, // $15
    priceLabel: '$15',
    blurb: 'Extra translation characters across all registered language pairs.',
    stripePriceEnv: 'STRIPE_PRICE_ID_TOPUP_TRANSLATE_200K',
  },
  {
    id: 'topup_chat_500k',
    name: '500,000 Conversational Tokens',
    productKind: 'chat',
    units: 500_000,
    unitLabel: 'tokens',
    priceCents: 1000, // $10
    priceLabel: '$10',
    blurb: 'Additional agent and chat reasoning tokens.',
    stripePriceEnv: 'STRIPE_PRICE_ID_TOPUP_CHAT_500K',
  },
];

export function getTopUpPack(id: string): TopUpPack | undefined {
  return TOP_UP_PACKS.find((p) => p.id === id);
}
