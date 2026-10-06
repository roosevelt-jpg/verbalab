export type PlanId = 'free' | 'starter' | 'creator' | 'pro' | 'scale' | 'enterprise';

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
  /** Higher = more entitlement. free=0 … enterprise=5 */
  rank: number;
  characterQuota: number;
  rateLimitPerKey: number;
  rateLimitPerOrg: number;
  priceLabel: string;
  priceMonthlyUsd: number | null;
  blurb: string;
  features: PlanFeature[];
  highlight?: boolean;
  stripePriceEnv?:
    | 'STRIPE_PRICE_ID_STARTER'
    | 'STRIPE_PRICE_ID_CREATOR'
    | 'STRIPE_PRICE_ID_PRO'
    | 'STRIPE_PRICE_ID_SCALE';
};

const ALL_CORE: PlanFeature[] = ['speech', 'translate', 'playground'];

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
    priceLabel: '$0',
    priceMonthlyUsd: 0,
    blurb: 'Explore Lugemi speech, translate, and playground with a monthly character quota.',
    features: [...ALL_CORE],
  };
}

function starterPlan(): PlanDefinition {
  return {
    id: 'starter',
    name: 'Starter',
    rank: 1,
    characterQuota: envQuota('BILLING_STARTER_CHARACTER_QUOTA', 200_000),
    rateLimitPerKey: Number(process.env.RATE_LIMIT_STARTER_PER_KEY ?? 120),
    rateLimitPerOrg: Number(process.env.RATE_LIMIT_STARTER_PER_ORG ?? 300),
    priceLabel: '$22',
    priceMonthlyUsd: 22,
    blurb: 'Indie builders shipping first African-language agents and product voice.',
    features: [...ALL_CORE, 'commercial'],
    stripePriceEnv: 'STRIPE_PRICE_ID_STARTER',
  };
}

function creatorPlan(): PlanDefinition {
  return {
    id: 'creator',
    name: 'Creator',
    rank: 2,
    characterQuota: envQuota('BILLING_CREATOR_CHARACTER_QUOTA', 500_000),
    rateLimitPerKey: Number(process.env.RATE_LIMIT_CREATOR_PER_KEY ?? 200),
    rateLimitPerOrg: Number(process.env.RATE_LIMIT_CREATOR_PER_ORG ?? 600),
    priceLabel: '$99',
    priceMonthlyUsd: 99,
    blurb: 'Studios and agencies — commercial use plus consent-gated voice clones.',
    features: [...ALL_CORE, 'commercial', 'voiceClones'],
    highlight: true,
    stripePriceEnv: 'STRIPE_PRICE_ID_CREATOR',
  };
}

function proPlan(): PlanDefinition {
  return {
    id: 'pro',
    name: 'Pro',
    rank: 3,
    characterQuota: envQuota('BILLING_PRO_CHARACTER_QUOTA', 2_000_000),
    rateLimitPerKey: Number(process.env.RATE_LIMIT_PRO_PER_KEY ?? 300),
    rateLimitPerOrg: Number(process.env.RATE_LIMIT_PRO_PER_ORG ?? 1_000),
    priceLabel: '$330',
    priceMonthlyUsd: 330,
    blurb: 'Production teams — marketplace, fine-tunes, higher quotas, and priority paths.',
    features: [...ALL_CORE, 'commercial', 'voiceClones', 'marketplace', 'fineTunes', 'prioritySupport'],
    stripePriceEnv: 'STRIPE_PRICE_ID_PRO',
  };
}

function scalePlan(): PlanDefinition {
  return {
    id: 'scale',
    name: 'Scale',
    rank: 4,
    characterQuota: envQuota('BILLING_SCALE_CHARACTER_QUOTA', 11_000_000),
    rateLimitPerKey: Number(process.env.RATE_LIMIT_SCALE_PER_KEY ?? 600),
    rateLimitPerOrg: Number(process.env.RATE_LIMIT_SCALE_PER_ORG ?? 3_000),
    priceLabel: '$1,320',
    priceMonthlyUsd: 1320,
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
    stripePriceEnv: 'STRIPE_PRICE_ID_SCALE',
  };
}

function enterprisePlan(): PlanDefinition {
  return {
    id: 'enterprise',
    name: 'Enterprise',
    rank: 5,
    characterQuota: envQuota('BILLING_ENTERPRISE_CHARACTER_QUOTA', 50_000_000),
    rateLimitPerKey: Number(process.env.RATE_LIMIT_ENTERPRISE_PER_KEY ?? 2_000),
    rateLimitPerOrg: Number(process.env.RATE_LIMIT_ENTERPRISE_PER_ORG ?? 10_000),
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
  starter: starterPlan,
  creator: creatorPlan,
  pro: proPlan,
  scale: scalePlan,
  enterprise: enterprisePlan,
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  get free() {
    return freePlan();
  },
  get starter() {
    return starterPlan();
  },
  get creator() {
    return creatorPlan();
  },
  get pro() {
    return proPlan();
  },
  get scale() {
    return scalePlan();
  },
  get enterprise() {
    return enterprisePlan();
  },
};

export function listPlans(): PlanDefinition[] {
  return (Object.keys(BUILDERS) as PlanId[]).map((id) => BUILDERS[id]());
}

export function planFromId(id: string): PlanDefinition {
  if (id in BUILDERS) return BUILDERS[id as PlanId]();
  return freePlan();
}

/** True when org plan rank is at least the required plan. */
export function planMeets(orgPlanId: string, required: PlanId): boolean {
  return planFromId(orgPlanId).rank >= planFromId(required).rank;
}

/** Legacy helper: Pro and above (Creator was not paid production — Pro+). */
export function isProOrAbove(orgPlanId: string): boolean {
  return planMeets(orgPlanId, 'pro');
}

export function planHasFeature(orgPlanId: string, feature: PlanFeature): boolean {
  return planFromId(orgPlanId).features.includes(feature);
}

export function rateLimitWindowSec(): number {
  const raw = Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 60;
}
