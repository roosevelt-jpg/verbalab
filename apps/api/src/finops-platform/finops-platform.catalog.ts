/**
 * Library Phase 176 → FinOps Platform (VL-309).
 * Pairs with Volume 7 GPU/Inference cost surfaces. Catalog/dashboard — not cloud-billing OS.
 */
export type FinOpsBudget = {
  id: string;
  name: string;
  kind: 'gpu' | 'model' | 'cloud' | 'storage' | 'bandwidth';
  monthlyUsd: number;
  alertThresholdPct: number;
  source: string;
  notes: string;
};

export type FinOpsAlert = {
  id: string;
  budgetId: string;
  kind: 'gpu' | 'model' | 'cloud' | 'storage' | 'bandwidth';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  enabled: boolean;
  notes: string;
};

export type FinOpsCostRow = {
  id: string;
  name: string;
  kind: 'cloud' | 'gpu' | 'model' | 'storage' | 'bandwidth' | 'chargeback' | 'showback' | 'forecast';
  monthlyUsd: number;
  notes: string;
};

export function seedFinOpsBudgets(): FinOpsBudget[] {
  return [
    {
      id: 'budget-gpu-monthly',
      name: 'GPU monthly budget',
      kind: 'gpu',
      monthlyUsd: 2500,
      alertThresholdPct: 80,
      source: 'Volume 7 gpu-platform / ai-runtime-analytics',
      notes: 'Primary GPU budget alert — pairs Inference Cloud cost surfaces.',
    },
    {
      id: 'budget-model-inference',
      name: 'Model inference budget',
      kind: 'model',
      monthlyUsd: 1200,
      alertThresholdPct: 85,
      source: 'Volume 7 inference cost ledger',
      notes: 'Model/token cost budget with alert seeding.',
    },
    {
      id: 'budget-cloud-compute',
      name: 'Cloud compute budget',
      kind: 'cloud',
      monthlyUsd: 1800,
      alertThresholdPct: 90,
      source: 'Fly shared platform',
      notes: 'Shared platform compute showback.',
    },
    {
      id: 'budget-storage',
      name: 'Storage budget',
      kind: 'storage',
      monthlyUsd: 400,
      alertThresholdPct: 90,
      source: 'Object + Postgres storage',
      notes: 'Storage cost showback.',
    },
    {
      id: 'budget-bandwidth',
      name: 'Bandwidth budget',
      kind: 'bandwidth',
      monthlyUsd: 300,
      alertThresholdPct: 90,
      source: 'Egress estimates',
      notes: 'Bandwidth cost showback.',
    },
  ];
}

export function seedFinOpsAlerts(): FinOpsAlert[] {
  return [
    {
      id: 'alert-gpu-80',
      budgetId: 'budget-gpu-monthly',
      kind: 'gpu',
      severity: 'high',
      message: 'GPU spend crossed 80% of monthly budget',
      enabled: true,
      notes: 'gpuBudgetAlertsEnabled=true — Volume 7 pairing.',
    },
    {
      id: 'alert-gpu-critical',
      budgetId: 'budget-gpu-monthly',
      kind: 'gpu',
      severity: 'critical',
      message: 'GPU spend projected to exceed monthly budget',
      enabled: true,
      notes: 'Critical GPU budget alert seed row.',
    },
    {
      id: 'alert-model-85',
      budgetId: 'budget-model-inference',
      kind: 'model',
      severity: 'high',
      message: 'Model inference spend crossed 85% of budget',
      enabled: true,
      notes: 'Model cost alert seed.',
    },
    {
      id: 'alert-cloud-90',
      budgetId: 'budget-cloud-compute',
      kind: 'cloud',
      severity: 'medium',
      message: 'Cloud compute spend crossed 90% of budget',
      enabled: true,
      notes: 'Cloud compute alert seed.',
    },
  ];
}

export function seedFinOpsCosts(): FinOpsCostRow[] {
  return [
    { id: 'cost-gpu', name: 'GPU hours', kind: 'gpu', monthlyUsd: 1875, notes: 'From gpu-platform / ai-runtime-analytics.' },
    { id: 'cost-model', name: 'Model inference', kind: 'model', monthlyUsd: 940, notes: 'Token/model ledger showback.' },
    { id: 'cost-cloud', name: 'Cloud compute', kind: 'cloud', monthlyUsd: 1320, notes: 'Fly shared platform.' },
    { id: 'cost-storage', name: 'Storage', kind: 'storage', monthlyUsd: 210, notes: 'DB + object storage.' },
    { id: 'cost-bandwidth', name: 'Bandwidth', kind: 'bandwidth', monthlyUsd: 95, notes: 'Egress estimate.' },
    { id: 'cost-chargeback', name: 'Team chargeback', kind: 'chargeback', monthlyUsd: 4440, notes: 'Chargeback rollup.' },
    { id: 'cost-showback', name: 'Org showback', kind: 'showback', monthlyUsd: 4440, notes: 'Showback rollup.' },
    { id: 'cost-forecast', name: '30d forecast', kind: 'forecast', monthlyUsd: 5100, notes: 'Simple linear forecast seed.' },
  ];
}

export function finopsPlatformEngineCatalog() {
  const budgets = seedFinOpsBudgets();
  const alerts = seedFinOpsAlerts();
  const costs = seedFinOpsCosts();
  return {
    product: 'Lugemi FinOps Platform',
    capabilities: [
      { id: 'cloud_cost', name: 'Cloud Cost', status: 'shipped', notes: 'Shared platform cost.' },
      { id: 'gpu_cost', name: 'GPU Cost', status: 'shipped', notes: 'Volume 7 GPU pairing.' },
      { id: 'model_cost', name: 'Model Cost', status: 'shipped', notes: 'Inference ledger.' },
      { id: 'storage_cost', name: 'Storage Cost', status: 'shipped', notes: 'Storage showback.' },
      { id: 'bandwidth_cost', name: 'Bandwidth Cost', status: 'shipped', notes: 'Bandwidth showback.' },
      { id: 'chargeback', name: 'Chargeback', status: 'shipped', notes: 'Team chargeback.' },
      { id: 'showback', name: 'Showback', status: 'shipped', notes: 'Org showback.' },
      { id: 'forecast', name: 'Forecast', status: 'shipped', notes: 'Cost forecast seed.' },
      { id: 'budgets', name: 'Budgets', status: 'shipped', notes: 'Budget seed rows.' },
      { id: 'alerts', name: 'Budget Alerts', status: 'shipped', notes: 'GPU/model alerts enabled.' },
    ],
    costs,
    budgets,
    alerts,
    gpuBudgetAlertsEnabled: true,
    honesty: {
      finopsOs: false,
      cloudBillingOs: false,
      gpuBudgetAlertsEnabled: true,
      pairsVolume7GpuCosts: true,
      regeneratesVolumes1to15: false,
      integratesExistingSystems: true,
      internalEngineeringTooling: true,
    },
    safety: {
      finopsOs: false,
      gpuBudgetAlertsEnabled: true,
      note:
        'FinOps is a catalog/dashboard over Volume 7 GPU/inference costs and shared platform spend — not a cloud-billing OS. GPU budget alerts are enabled.',
    },
    docs: '/docs/FINOPS_PLATFORM.md',
    note:
      'FinOps Platform (VL-309). Cloud/GPU/model/storage/bandwidth + chargeback/showback/forecast/budgets. gpuBudgetAlertsEnabled=true; finopsOs=false.',
  };
}
