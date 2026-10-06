export type PlanId = 'free' | 'pro' | 'business' | 'enterprise';

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

export type PlanDefinition = {
  id: PlanId;
  name: string;
  /** Higher = more entitlement. free=0 … enterprise=3 */
  rank: number;
  characterQuota: number;
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
  stripePriceEnv?: 'STRIPE_PRICE_ID_PRO' | 'STRIPE_PRICE_ID_BUSINESS';
};

const ALL_CORE: PlanFeature[] = ['speech', 'translate', 'playground'];

/** Legacy plan ids (removed SKUs) → current PlanId. */
const LEGACY_PLAN_MAP: Record<string, PlanId> = {
  starter: 'pro',
  creator: 'pro',
  scale: 'business',
};

function envQuota(key: string, fallback: number) {
  const n = Number(process.env[key] ?? fallback);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function freePlan(): PlanDefinition {
  return {
    id: 'free',
    name: 'Free',
    rank: 0,
    characterQuota: envQuota('BILLING_FREE_CHARACTER_QUOTA', 50_000),
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
  return {
    id: 'pro',
    name: 'Pro',
    rank: 1,
    characterQuota: envQuota('BILLING_PRO_CHARACTER_QUOTA', 2_000_000),
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
  return {
    id: 'business',
    name: 'Business',
    rank: 2,
    characterQuota: envQuota('BILLING_BUSINESS_CHARACTER_QUOTA', 11_000_000),
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
  return {
    id: 'enterprise',
    name: 'Enterprise',
    rank: 3,
    characterQuota: envQuota('BILLING_ENTERPRISE_CHARACTER_QUOTA', 50_000_000),
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

const BUILDERS: Record<PlanId, () => PlanDefinition> = {
  free: freePlan,
  pro: proPlan,
  business: businessPlan,
  enterprise: enterprisePlan,
};

export const PLAN_IDS: PlanId[] = ['free', 'pro', 'business', 'enterprise'];

export const PLANS: Record<PlanId, PlanDefinition> = {
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

export function normalizePlanId(id: string | null | undefined): PlanId {
  if (!id) return 'free';
  if (id in BUILDERS) return id as PlanId;
  return LEGACY_PLAN_MAP[id] ?? 'free';
}

export function listPlans(): PlanDefinition[] {
  return PLAN_IDS.map((id) => BUILDERS[id]());
}

export function planFromId(id: string): PlanDefinition {
  return BUILDERS[normalizePlanId(id)]();
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
