export type CostCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type CostCapability = {
  id: string;
  name: string;
  status: CostCapabilityStatus;
  api: string | null;
  notes: string;
};

export type CostSpendCategory =
  | 'provider'
  | 'gpu'
  | 'router'
  | 'batch'
  | 'cache'
  | 'other';

export const COST_SPEND_CATEGORIES: CostSpendCategory[] = [
  'provider',
  'gpu',
  'router',
  'batch',
  'cache',
  'other',
];

export function costOptimizationMode(): 'disabled' | 'sandbox' {
  const raw = (process.env.LUGEMI_COST_OPTIMIZATION_MODE ?? 'sandbox').toLowerCase();
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

/** Hard spend caps — not soft reporting targets. */
export function costCeilings() {
  const daily = Math.max(
    0.01,
    Number(process.env.LUGEMI_COST_DAILY_CAP_USD ?? '10') || 10,
  );
  const monthly = Math.max(
    0.01,
    Number(process.env.LUGEMI_COST_MONTHLY_CAP_USD ?? '100') || 100,
  );
  return {
    defaultDailyCapUsd: Math.min(daily, 10_000),
    defaultMonthlyCapUsd: Math.min(monthly, 100_000),
    maxDailyCapUsd: 10_000,
    maxMonthlyCapUsd: 100_000,
    enforceByDefault: true,
    mode: costOptimizationMode(),
    note:
      'Hard daily/monthly USD caps enforced on record/check and AI Router resolve. Not a cloud FinOps OS. Spot/reserved are sandbox planning hints — no AWS Spot APIs.',
  };
}

/**
 * Cost Optimization Engine.
 * Enforces spend caps — does not invent FinOps / Spot / reserved cloud OS.
 */
export function costOptimizationCatalog() {
  return {
    product: 'Lugemi Cost Optimization Engine',
    note:
      'Cost Optimization. Org/workspace daily/monthly spend caps with hard enforce on record/check and AI Router resolve. Dynamic routing prefers cheaper Gateway candidates; GPU cost views reuse ceilings; spot/reserved are sandbox planning only. Not a cloud FinOps OS, Spot marketplace, or reserved-instance broker.',
    capabilities: [
      {
        id: 'dynamic-routing',
        name: 'Dynamic Routing',
        status: 'partial',
        api: 'POST /v1/cost-optimization/optimize',
        notes: 'Cost-preferring route plan over AI Router candidates — not a mesh.',
      },
      {
        id: 'gpu-cost-optimization',
        name: 'GPU Cost Optimization',
        status: 'partial',
        api: 'GET /v1/cost-optimization/gpu',
        notes: 'Surfaces GPU Platform ceilings + estimated spend; hard GPU caps remain enforced.',
      },
      {
        id: 'provider-cost-optimization',
        name: 'Provider Cost Optimization',
        status: 'partial',
        api: 'POST /v1/cost-optimization/optimize',
        notes: 'Ranks Gateway providers by estimated USD.',
      },
      {
        id: 'autoscaling',
        name: 'Autoscaling',
        status: 'partial',
        api: 'GET /v1/cost-optimization/gpu',
        notes: 'Advisory scale-down when near spend caps — never open-ended autoscale.',
      },
      {
        id: 'spot-instances',
        name: 'Spot Instances',
        status: 'partial',
        api: 'GET /v1/cost-optimization/predictions',
        notes: 'Sandbox preferSpot planning hint — no cloud Spot APIs.',
      },
      {
        id: 'reserved-capacity',
        name: 'Reserved Capacity',
        status: 'partial',
        api: 'PUT /v1/cost-optimization/budgets',
        notes: 'Sandbox reservedCapacityUnits on budget — not RI marketplace.',
      },
      {
        id: 'prediction',
        name: 'Prediction',
        status: 'partial',
        api: 'GET /v1/cost-optimization/predictions',
        notes: 'Linear extrapolation from ledger — not ML demand forecasting OS.',
      },
      {
        id: 'optimization-engine',
        name: 'Optimization Engine',
        status: 'shipped',
        api: 'GET /v1/cost-optimization/engine',
        notes: 'Engine catalog + hard ceilings.',
      },
      {
        id: 'dashboard',
        name: 'Dashboard',
        status: 'shipped',
        api: '/cost-optimization',
        notes: 'Console hub for budgets/spend/optimize.',
      },
      {
        id: 'rest',
        name: 'REST APIs',
        status: 'shipped',
        api: 'GET /v1/cost-optimization/engine',
        notes: 'REST cost hub.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/cost-optimization/monitoring',
        notes: 'Cap utilization + honesty.',
      },
      {
        id: 'reports',
        name: 'Reports',
        status: 'shipped',
        api: 'GET /v1/cost-optimization/reports',
        notes: 'Daily/monthly spend reports from ledger.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/COST_OPTIMIZATION.md',
        notes: 'Product documentation.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'partial',
        api: 'POST /v1/cost-optimization/record',
        notes: 'Ships with Nest API — enforce before connecting real cloud bills.',
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        status: 'shipped',
        api: 'costOptimizationEngine',
        notes: 'Bounded GraphQL façade.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'costOptimizationEngine()',
        notes: '@lugemi/sdk',
      },
      {
        id: 'spend-enforcement',
        name: 'Spend Enforcement',
        status: 'shipped',
        api: 'POST /v1/cost-optimization/record',
        notes: 'Hard 402 when daily/monthly cap exceeded — not report-only.',
      },
    ] satisfies CostCapability[],
    honesty: {
      finOpsOs: false,
      cloudSpotApis: false,
      reservedInstanceMarketplace: false,
      openEndedAutoscale: false,
      regeneratesAiGateway: false,
      regeneratesBilling: false,
      enforcesSpendCaps: true,
      reportOnly: false,
      orgWorkspaceScoped: true,
      extendsGpuPlatform: true,
      extendsAiRouter: true,
      primaryRegion: 'af-south-1',
    },
    links: {
      console: '/cost-optimization',
      hub: '/inference-cloud',
      gpuPlatform: '/gpu-platform',
      aiRouter: '/ai-router',
      billing: '/billing',
      usage: '/usage',
      docs: '/docs/COST_OPTIMIZATION.md',
      adr: '/docs/adr/0122-cost-optimization.md',
    },
  };
}
