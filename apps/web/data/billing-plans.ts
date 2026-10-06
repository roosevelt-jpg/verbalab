/** Client-side plan catalog mirroring apps/api billing plans (exactly 4). */
export type WebPlanId = 'free' | 'pro' | 'business' | 'enterprise';

export type WebPlan = {
  id: WebPlanId;
  name: string;
  rank: number;
  characterQuota: number;
  /** -1 = unlimited */
  workspaceLimit: number;
  priceLabel: string;
  priceMonthlyUsd: number | null;
  blurb: string;
  features: string[];
  highlight: boolean;
  checkoutAvailable: boolean;
};

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
