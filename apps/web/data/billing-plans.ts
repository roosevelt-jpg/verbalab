/** Client-side plan catalog mirroring apps/api billing plans (exactly 4 base plans). */
export type WebPlanId = 'free' | 'pro' | 'business' | 'enterprise' | (string & {});

export type WebPlan = {
  id: string;
  name: string;
  rank: number;
  characterQuota: number;
  sttMinutesQuota?: number;
  ttsCharsQuota?: number;
  translateCharsQuota?: number;
  chatTokensQuota?: number;
  ocrPagesQuota?: number;
  /** -1 = unlimited */
  workspaceLimit: number;
  priceLabel: string;
  priceMonthlyUsd: number | null;
  blurb: string;
  features: string[];
  highlight: boolean;
  checkoutAvailable: boolean;
  isCustom?: boolean;
};

export type TopUpPack = {
  id: string;
  name: string;
  productKind: 'tts' | 'stt' | 'translate' | 'chat' | 'general';
  units: number;
  unitLabel: string;
  priceCents: number;
  priceLabel: string;
  blurb: string;
};

export const WEB_TOP_UP_PACKS: TopUpPack[] = [
  {
    id: 'topup_tts_100k',
    name: '100,000 Voice / TTS Characters',
    productKind: 'tts',
    units: 100_000,
    unitLabel: 'chars',
    priceCents: 1000,
    priceLabel: '$10',
    blurb: 'Instant top-up for speech synthesis and voice turns when plan quota is exhausted.',
  },
  {
    id: 'topup_tts_500k',
    name: '500,000 Voice / TTS Characters',
    productKind: 'tts',
    units: 500_000,
    unitLabel: 'chars',
    priceCents: 4500,
    priceLabel: '$45',
    blurb: 'High-volume character refill with 10% volume discount.',
  },
  {
    id: 'topup_stt_60m',
    name: '60 STT / Transcription Minutes',
    productKind: 'stt',
    units: 60,
    unitLabel: 'minutes',
    priceCents: 1200,
    priceLabel: '$12',
    blurb: 'Extra hours of speech recognition and audio transcription.',
  },
  {
    id: 'topup_translate_200k',
    name: '200,000 Translation Characters',
    productKind: 'translate',
    units: 200_000,
    unitLabel: 'chars',
    priceCents: 1500,
    priceLabel: '$15',
    blurb: 'Extra translation characters across all registered language pairs.',
  },
  {
    id: 'topup_chat_500k',
    name: '500,000 Conversational Tokens',
    productKind: 'chat',
    units: 500_000,
    unitLabel: 'tokens',
    priceCents: 1000,
    priceLabel: '$10',
    blurb: 'Additional agent and chat reasoning tokens.',
  },
];

export const FEATURE_LABELS: Record<string, string> = {
  speech: 'Speech & TTS',
  translate: 'Translate',
  playground: 'Playground',
  commercial: 'Commercial use',
  voiceClones: 'Voice clones',
  marketplace: 'Marketplace',
  fineTunes: 'Fine-tunes',
  prioritySupport: 'Priority support',
  workspacesExtra: 'Extra workspaces',
  sso: 'SSO',
  dedicated: 'Dedicated capacity',
};

/** Min plan rank that unlocks a named entitlement feature. */
export const FEATURE_MIN_PLAN: Record<string, WebPlanId> = {
  speech: 'free',
  translate: 'free',
  playground: 'free',
  commercial: 'pro',
  voiceClones: 'pro',
  marketplace: 'pro',
  fineTunes: 'pro',
  prioritySupport: 'pro',
  workspacesExtra: 'business',
  sso: 'enterprise',
  dedicated: 'enterprise',
};

/** Legacy plan ids → current catalog id. */
const LEGACY_WEB_PLAN_MAP: Record<string, WebPlanId> = {
  starter: 'pro',
  creator: 'pro',
  scale: 'business',
};

export const WEB_BILLING_PLANS: WebPlan[] = [
  {
    id: 'free',
    name: 'Free',
    rank: 0,
    characterQuota: 50_000,
    sttMinutesQuota: 30,
    ttsCharsQuota: 50_000,
    translateCharsQuota: 50_000,
    chatTokensQuota: 50_000,
    ocrPagesQuota: 25,
    workspaceLimit: 1,
    priceLabel: '$0',
    priceMonthlyUsd: 0,
    blurb: 'Explore Lugemi speech, translate, and playground with a monthly character quota.',
    features: ['speech', 'translate', 'playground'],
    highlight: false,
    checkoutAvailable: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    rank: 1,
    characterQuota: 2_000_000,
    sttMinutesQuota: 300,
    ttsCharsQuota: 2_000_000,
    translateCharsQuota: 2_000_000,
    chatTokensQuota: 1_000_000,
    ocrPagesQuota: 500,
    workspaceLimit: 1,
    priceLabel: '$99',
    priceMonthlyUsd: 99,
    blurb: 'Production teams — commercial use, voice clones, marketplace, fine-tunes, and priority paths.',
    features: [
      'speech',
      'translate',
      'playground',
      'commercial',
      'voiceClones',
      'marketplace',
      'fineTunes',
      'prioritySupport',
    ],
    highlight: true,
    checkoutAvailable: true,
  },
  {
    id: 'business',
    name: 'Business',
    rank: 2,
    characterQuota: 11_000_000,
    sttMinutesQuota: 1_500,
    ttsCharsQuota: 11_000_000,
    translateCharsQuota: 11_000_000,
    chatTokensQuota: 5_000_000,
    ocrPagesQuota: 2_500,
    workspaceLimit: 3,
    priceLabel: '$330',
    priceMonthlyUsd: 330,
    blurb: 'High-volume workspaces across regions with extra seats and headroom.',
    features: [
      'speech',
      'translate',
      'playground',
      'commercial',
      'voiceClones',
      'marketplace',
      'fineTunes',
      'prioritySupport',
      'workspacesExtra',
    ],
    highlight: false,
    checkoutAvailable: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    rank: 3,
    characterQuota: 50_000_000,
    sttMinutesQuota: 10_000,
    ttsCharsQuota: 50_000_000,
    translateCharsQuota: 50_000_000,
    chatTokensQuota: 25_000_000,
    ocrPagesQuota: 10_000,
    workspaceLimit: -1,
    priceLabel: 'Custom',
    priceMonthlyUsd: null,
    blurb: 'SSO, dedicated capacity, custom contracts, and Africa-first SLA packaging.',
    features: [
      'speech',
      'translate',
      'playground',
      'commercial',
      'voiceClones',
      'marketplace',
      'fineTunes',
      'prioritySupport',
      'workspacesExtra',
      'sso',
      'dedicated',
    ],
    highlight: false,
    checkoutAvailable: false,
  },
];

export function planById(id: string): WebPlan {
  const normalized = LEGACY_WEB_PLAN_MAP[id] ?? id;
  return WEB_BILLING_PLANS.find((p) => p.id === normalized) ?? WEB_BILLING_PLANS[0]!;
}

export function planHasFeature(planId: string, feature: string): boolean {
  return planById(planId).features.includes(feature);
}

export function formatWorkspaceLimit(limit: number): string {
  return limit < 0 ? 'Unlimited' : String(limit);
}
