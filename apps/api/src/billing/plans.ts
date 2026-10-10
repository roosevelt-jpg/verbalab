export type PlanId = 'free' | 'pro' | 'business' | 'enterprise' | (string & {});

export type PlanFeature =
  | 'speech'
  | 'translate'
  | 'playground'
  | 'commercial'
  | 'voiceClones'
  | 'marketplace'
  | 'fineTunes'
  | 'prioritySupport'
  | 'sso'
  | 'dedicated'
  | 'workspacesExtra';

export type PlanProductQuotas = {
  characterQuota: number; // General / combined quota
  sttMinutesQuota: number;
  ttsCharsQuota: number;
  translateCharsQuota: number;
  chatTokensQuota: number;
  ocrPagesQuota: number;
};

export type PlanDefinition = PlanProductQuotas & {
  id: string;
  name: string;
  /** Higher = more entitlement. free=0 … enterprise=3 */
  rank: number;
  rateLimitPerKey: number;
  rateLimitPerOrg: number;
  /**
   * Max workspaces per org.
   * Use -1 for unlimited (Enterprise).
   */
  workspaceLimit: number;
  priceLabel: string;
  priceMonthlyUsd: number | null;
  blurb: string;
  features: PlanFeature[];
  highlight?: boolean;
  isCustom?: boolean;
  stripePriceEnv?: 'STRIPE_PRICE_ID_PRO' | 'STRIPE_PRICE_ID_BUSINESS';
  stripePriceId?: string;
};

const ALL_CORE: PlanFeature[] = ['speech', 'translate', 'playground'];

/** Legacy plan ids (removed SKUs) → current PlanId. */
const LEGACY_PLAN_MAP: Record<string, string> = {
  starter: 'pro',
  creator: 'pro',
  scale: 'business',
};

function envQuota(key: string, fallback: number) {
  const n = Number(process.env[key] ?? fallback);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function freePlan(): PlanDefinition {
  const chars = envQuota('BILLING_FREE_CHARACTER_QUOTA', 50_000);
  return {
    id: 'free',
    name: 'Free',
    rank: 0,
    characterQuota: chars,
    sttMinutesQuota: envQuota('BILLING_FREE_STT_MINUTES_QUOTA', 30),
    ttsCharsQuota: envQuota('BILLING_FREE_TTS_CHARS_QUOTA', 50_000),
    translateCharsQuota: envQuota('BILLING_FREE_TRANSLATE_CHARS_QUOTA', 50_000),
    chatTokensQuota: envQuota('BILLING_FREE_CHAT_TOKENS_QUOTA', 50_000),
    ocrPagesQuota: envQuota('BILLING_FREE_OCR_PAGES_QUOTA', 25),
    rateLimitPerKey: Number(process.env.RATE_LIMIT_FREE_PER_KEY ?? 60),
    rateLimitPerOrg: Number(process.env.RATE_LIMIT_FREE_PER_ORG ?? 120),
    workspaceLimit: 1,
    priceLabel: '$0',
    priceMonthlyUsd: 0,
    blurb: 'Explore Lugemi speech, translate, and playground with a monthly character quota.',
    features: [...ALL_CORE],
  };
}

function proPlan(): PlanDefinition {
  const chars = envQuota('BILLING_PRO_CHARACTER_QUOTA', 2_000_000);
  return {
    id: 'pro',
    name: 'Pro',
    rank: 1,
    characterQuota: chars,
    sttMinutesQuota: envQuota('BILLING_PRO_STT_MINUTES_QUOTA', 300),
    ttsCharsQuota: envQuota('BILLING_PRO_TTS_CHARS_QUOTA', 2_000_000),
    translateCharsQuota: envQuota('BILLING_PRO_TRANSLATE_CHARS_QUOTA', 2_000_000),
    chatTokensQuota: envQuota('BILLING_PRO_CHAT_TOKENS_QUOTA', 1_000_000),
    ocrPagesQuota: envQuota('BILLING_PRO_OCR_PAGES_QUOTA', 500),
    rateLimitPerKey: Number(process.env.RATE_LIMIT_PRO_PER_KEY ?? 300),
    rateLimitPerOrg: Number(process.env.RATE_LIMIT_PRO_PER_ORG ?? 1_000),
    workspaceLimit: 1,
    priceLabel: '$99',
    priceMonthlyUsd: 99,
    blurb: 'Production teams — commercial use, voice clones, marketplace, fine-tunes, and priority paths.',
    features: [
      ...ALL_CORE,
      'commercial',
      'voiceClones',
      'marketplace',
      'fineTunes',
      'prioritySupport',
    ],
    highlight: true,
    stripePriceEnv: 'STRIPE_PRICE_ID_PRO',
  };
}

function businessPlan(): PlanDefinition {
  const chars = envQuota('BILLING_BUSINESS_CHARACTER_QUOTA', 11_000_000);
  return {
    id: 'business',
    name: 'Business',
    rank: 2,
    characterQuota: chars,
    sttMinutesQuota: envQuota('BILLING_BUSINESS_STT_MINUTES_QUOTA', 1_500),
    ttsCharsQuota: envQuota('BILLING_BUSINESS_TTS_CHARS_QUOTA', 11_000_000),
    translateCharsQuota: envQuota('BILLING_BUSINESS_TRANSLATE_CHARS_QUOTA', 11_000_000),
    chatTokensQuota: envQuota('BILLING_BUSINESS_CHAT_TOKENS_QUOTA', 5_000_000),
    ocrPagesQuota: envQuota('BILLING_BUSINESS_OCR_PAGES_QUOTA', 2_500),
    rateLimitPerKey: Number(process.env.RATE_LIMIT_BUSINESS_PER_KEY ?? 600),
    rateLimitPerOrg: Number(process.env.RATE_LIMIT_BUSINESS_PER_ORG ?? 3_000),
    workspaceLimit: 3,
    priceLabel: '$330',
    priceMonthlyUsd: 330,
    blurb: 'High-volume workspaces across regions with extra seats and headroom.',
    features: [
      ...ALL_CORE,
      'commercial',
      'voiceClones',
      'marketplace',
      'fineTunes',
      'prioritySupport',
      'workspacesExtra',
    ],
    stripePriceEnv: 'STRIPE_PRICE_ID_BUSINESS',
  };
}

function enterprisePlan(): PlanDefinition {
  const chars = envQuota('BILLING_ENTERPRISE_CHARACTER_QUOTA', 50_000_000);
  return {
    id: 'enterprise',
    name: 'Enterprise',
    rank: 3,
    characterQuota: chars,
    sttMinutesQuota: envQuota('BILLING_ENTERPRISE_STT_MINUTES_QUOTA', 10_000),
    ttsCharsQuota: envQuota('BILLING_ENTERPRISE_TTS_CHARS_QUOTA', 50_000_000),
    translateCharsQuota: envQuota('BILLING_ENTERPRISE_TRANSLATE_CHARS_QUOTA', 50_000_000),
    chatTokensQuota: envQuota('BILLING_ENTERPRISE_CHAT_TOKENS_QUOTA', 25_000_000),
    ocrPagesQuota: envQuota('BILLING_ENTERPRISE_OCR_PAGES_QUOTA', 10_000),
    rateLimitPerKey: Number(process.env.RATE_LIMIT_ENTERPRISE_PER_KEY ?? 2_000),
    rateLimitPerOrg: Number(process.env.RATE_LIMIT_ENTERPRISE_PER_ORG ?? 10_000),
    workspaceLimit: -1,
    priceLabel: 'Custom',
    priceMonthlyUsd: null,
    blurb: 'SSO, dedicated capacity, custom contracts, and Africa-first SLA packaging.',
    features: [
      ...ALL_CORE,
      'commercial',
      'voiceClones',
      'marketplace',
      'fineTunes',
      'prioritySupport',
      'workspacesExtra',
      'sso',
      'dedicated',
    ],
  };
}

const BUILDERS: Record<string, () => PlanDefinition> = {
  free: freePlan,
  pro: proPlan,
  business: businessPlan,
  enterprise: enterprisePlan,
};

export const BASE_PLAN_IDS: ('free' | 'pro' | 'business' | 'enterprise')[] = [
  'free',
  'pro',
  'business',
  'enterprise',
];

export const PLAN_IDS = BASE_PLAN_IDS;

export const PLANS: Record<string, PlanDefinition> = {
  get free() {
    return freePlan();
  },
  get pro() {
    return proPlan();
  },
  get business() {
    return businessPlan();
  },
  get enterprise() {
    return enterprisePlan();
  },
};

export function normalizePlanId(id: string | null | undefined): string {
  if (!id) return 'free';
  if (id in BUILDERS) return id;
  return LEGACY_PLAN_MAP[id] ?? id;
}

export function listPlans(): PlanDefinition[] {
  return BASE_PLAN_IDS.map((id) => BUILDERS[id]!());
}

export function planFromId(id: string): PlanDefinition {
  const norm = normalizePlanId(id);
  if (norm in BUILDERS) {
    return BUILDERS[norm]!();
  }
  // Fallback for custom plan when loaded statically
  return {
    id: norm,
    name: norm.charAt(0).toUpperCase() + norm.slice(1),
    rank: 1,
    characterQuota: 2_000_000,
    sttMinutesQuota: 300,
    ttsCharsQuota: 2_000_000,
    translateCharsQuota: 2_000_000,
    chatTokensQuota: 1_000_000,
    ocrPagesQuota: 500,
    rateLimitPerKey: 300,
    rateLimitPerOrg: 1_000,
    workspaceLimit: 1,
    priceLabel: '$99',
    priceMonthlyUsd: 99,
    blurb: 'Custom platform plan',
    features: [...ALL_CORE],
    isCustom: true,
  };
}

/** True when org plan rank is at least the required plan. */
export function planMeets(orgPlanId: string, required: PlanId): boolean {
  return planFromId(orgPlanId).rank >= planFromId(required).rank;
}

/** Pro and above (Business, Enterprise). */
export function isProOrAbove(orgPlanId: string): boolean {
  return planMeets(orgPlanId, 'pro');
}

export function planHasFeature(orgPlanId: string, feature: PlanFeature): boolean {
  return planFromId(orgPlanId).features.includes(feature);
}

/** Workspace cap for a plan; -1 means unlimited. */
export function planWorkspaceLimit(orgPlanId: string): number {
  return planFromId(orgPlanId).workspaceLimit;
}

export function planAllowsAnotherWorkspace(orgPlanId: string, currentCount: number): boolean {
  const limit = planWorkspaceLimit(orgPlanId);
  if (limit < 0) return true;
  return currentCount < limit;
}

export function rateLimitWindowSec(): number {
  const raw = Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 60;
}
