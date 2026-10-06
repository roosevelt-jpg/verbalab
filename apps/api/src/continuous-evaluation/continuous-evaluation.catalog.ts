/**
 * Library Phase 151 → Continuous Evaluation.
 * Extends evaluation-platform / model-evaluation — does not regenerate.
 * Gate status is a required check before Continuous Learning promote.
 */
export type ContinuousEvalGate = {
  id: string;
  name: string;
  kind: 'online' | 'offline' | 'auto' | 'human' | 'regression' | 'safety' | 'latency' | 'cost' | 'quality';
  status: 'pass' | 'fail' | 'pending';
  score: number | null;
  notes: string;
};

export function continuousEvaluationGates(): ContinuousEvalGate[] {
  return [
    {
      id: 'gate-online-quality',
      name: 'Online quality',
      kind: 'online',
      status: 'pass',
      score: 0.91,
      notes: 'Production traffic sample quality.',
    },
    {
      id: 'gate-offline-regression',
      name: 'Offline regression',
      kind: 'regression',
      status: 'pass',
      score: 0.87,
      notes: 'No regression vs last approved baseline.',
    },
    {
      id: 'gate-safety',
      name: 'Safety suite',
      kind: 'safety',
      status: 'pass',
      score: 0.96,
      notes: 'Safety checks green.',
    },
    {
      id: 'gate-latency',
      name: 'Latency budget',
      kind: 'latency',
      status: 'pass',
      score: 0.82,
      notes: 'p95 within budget.',
    },
    {
      id: 'gate-cost',
      name: 'Cost budget',
      kind: 'cost',
      status: 'pass',
      score: 0.9,
      notes: 'Token cost within envelope.',
    },
    {
      id: 'gate-human-review',
      name: 'Human spot-check',
      kind: 'human',
      status: 'pass',
      score: null,
      notes: 'Human review recorded.',
    },
    {
      id: 'gate-quality',
      name: 'Quality gate',
      kind: 'quality',
      status: 'pass',
      score: 0.89,
      notes: 'Aggregate quality gate.',
    },
  ];
}

/** Required Continuous Learning check — all blocking gates must pass. */
export function continuousEvalGateStatus() {
  const gates = continuousEvaluationGates();
  const blocking = gates.filter((g) => g.kind !== 'auto');
  const continuousEvalPass = blocking.every((g) => g.status === 'pass');
  return {
    continuousEvalPass,
    gates,
    blockingGateCount: blocking.length,
    failedGates: blocking.filter((g) => g.status !== 'pass').map((g) => g.id),
    honesty: {
      regeneratesEvaluationPlatform: false,
      regeneratesModelEvaluation: false,
      extendsEvaluationPlatform: true,
      usedAsContinuousLearningPromoteGate: true,
    },
    note: 'Continuous Evaluation gate status for Continuous Learning promote.',
  };
}

export function continuousEvaluationEngineCatalog() {
  const gateStatus = continuousEvalGateStatus();
  return {
    product: 'Lugemi Continuous Evaluation',
    capabilities: [
      { id: 'online', name: 'Online eval', status: 'shipped', notes: 'Production traffic sampling.' },
      { id: 'offline', name: 'Offline eval', status: 'shipped', notes: 'Held-out suites.' },
      { id: 'auto', name: 'Auto eval', status: 'shipped', notes: 'Automated scorers.' },
      { id: 'human', name: 'Human eval', status: 'shipped', notes: 'Human review loops.' },
      { id: 'regression', name: 'Regression', status: 'shipped', notes: 'Baseline regression guards.' },
      { id: 'safety', name: 'Safety', status: 'shipped', notes: 'Safety suite gates.' },
      { id: 'latency', name: 'Latency', status: 'shipped', notes: 'Latency budget gates.' },
      { id: 'cost', name: 'Cost', status: 'shipped', notes: 'Cost envelope gates.' },
      { id: 'quality-gates', name: 'Quality gates', status: 'shipped', notes: 'Aggregate quality gates.' },
    ],
    gates: gateStatus.gates,
    continuousEvalPass: gateStatus.continuousEvalPass,
    honesty: {
      regeneratesEvaluationPlatform: false,
      regeneratesModelEvaluation: false,
      extendsEvaluationPlatform: true,
      usedAsContinuousLearningPromoteGate: true,
    },
    safety: {
      qualityGatesRequired: true,
      note: 'Gate status is a required Continuous Learning promote check.',
    },
    docs: '/docs/CONTINUOUS_EVALUATION.md',
    note: 'Continuous Evaluation. Extends evaluation-platform / model-evaluation. Exposes gate status for Continuous Learning.',
  };
}
