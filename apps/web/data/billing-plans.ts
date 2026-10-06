/** Client-side plan catalog mirroring apps/api billing plans (tiered). */
export type WebPlanId = 'free' | 'starter' | 'creator' | 'pro' | 'scale' | 'enterprise';

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
  commercial: 'starter',
  voiceClones: 'creator',
  marketplace: 'pro',
  fineTunes: 'pro',
  prioritySupport: 'pro',
  workspacesExtra: 'scale',
  sso: 'enterprise',
  dedicated: 'enterprise',
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
    id: 'starter',
    name: 'Starter',
    rank: 1,
    characterQuota: 200_000,
    workspaceLimit: 1,
    priceLabel: '$22',
    priceMonthlyUsd: 22,
    blurb: 'Indie builders shipping first African-language agents and product voice.',
    features: ['speech', 'translate', 'playground', 'commercial'],
    highlight: false,
    checkoutAvailable: true,
  },
  {
    id: 'creator',
    name: 'Creator',
    rank: 2,
    characterQuota: 500_000,
    workspaceLimit: 1,
    priceLabel: '$99',
    priceMonthlyUsd: 99,
    blurb: 'Studios and agencies — commercial use plus consent-gated voice clones.',
    features: ['speech', 'translate', 'playground', 'commercial', 'voiceClones'],
    highlight: true,
    checkoutAvailable: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    rank: 3,
    characterQuota: 2_000_000,
    workspaceLimit: 1,
    priceLabel: '$330',
    priceMonthlyUsd: 330,
    blurb: 'Production teams — marketplace, fine-tunes, higher quotas, and priority paths.',
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
    highlight: false,
    checkoutAvailable: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    rank: 4,
    characterQuota: 11_000_000,
    workspaceLimit: 3,
    priceLabel: '$1,320',
    priceMonthlyUsd: 1320,
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
    rank: 5,
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
  return WEB_BILLING_PLANS.find((p) => p.id === id) ?? WEB_BILLING_PLANS[0]!;
}

export function planHasFeature(planId: string, feature: string): boolean {
  return planById(planId).features.includes(feature);
}

export function formatWorkspaceLimit(limit: number): string {
  return limit < 0 ? 'Unlimited' : String(limit);
}
