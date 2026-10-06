export type PlanId = 'free' | 'pro';

export type PlanDefinition = {
  id: PlanId;
  name: string;
  characterQuota: number;
  /** Requests per window for a single API key. */
  rateLimitPerKey: number;
  /** Requests per window for the whole organization. */
  rateLimitPerOrg: number;
  /** Stripe Price ID for paid plans; free has none. */
  stripePriceEnv?: 'STRIPE_PRICE_ID_PRO';
};

function freePlan(): PlanDefinition {
  return {
    id: 'free',
    name: 'Free',
    characterQuota: Number(process.env.BILLING_FREE_CHARACTER_QUOTA ?? 50_000),
    rateLimitPerKey: Number(process.env.RATE_LIMIT_FREE_PER_KEY ?? 60),
    rateLimitPerOrg: Number(process.env.RATE_LIMIT_FREE_PER_ORG ?? 120),
  };
}

function proPlan(): PlanDefinition {
  return {
    id: 'pro',
    name: 'Pro',
    characterQuota: Number(process.env.BILLING_PRO_CHARACTER_QUOTA ?? 1_000_000),
    rateLimitPerKey: Number(process.env.RATE_LIMIT_PRO_PER_KEY ?? 300),
    rateLimitPerOrg: Number(process.env.RATE_LIMIT_PRO_PER_ORG ?? 1_000),
    stripePriceEnv: 'STRIPE_PRICE_ID_PRO',
  };
}

/** Snapshot of plans (recomputed so env overrides apply in tests). */
export const PLANS: Record<PlanId, PlanDefinition> = {
  get free() {
    return freePlan();
  },
  get pro() {
    return proPlan();
  },
};

export function planFromId(id: string): PlanDefinition {
  if (id === 'pro') return proPlan();
  return freePlan();
}

export function rateLimitWindowSec(): number {
  const raw = Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 60;
}
