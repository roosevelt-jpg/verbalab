export type BenchmarkStatus = 'shipped' | 'partial' | 'deferred';

export type BenchmarkSuite = {
  id: string;
  name: string;
  status: BenchmarkStatus;
  kind: 'task' | 'ops' | 'safety';
  api: string | null;
  notes: string;
};

export type LeaderboardRow = {
  id: string;
  suiteId: string;
  modelLabel: string;
  score: number;
  unit: string;
  notes: string;
};

/**
 * Library Phase 141 → Benchmark Platform (VL-274).
 * Suites + leaderboard seed — not a public leaderboard OS.
 */
export function benchmarkPlatformEngineCatalog() {
  const suites: BenchmarkSuite[] = [
    { id: 'translation', name: 'Translation benchmarks', status: 'shipped', kind: 'task', api: 'GET /v1/benchmark-platform/leaderboard', notes: 'MT quality suites.' },
    { id: 'speech', name: 'Speech benchmarks', status: 'shipped', kind: 'task', api: 'GET /v1/benchmark-platform/leaderboard', notes: 'WER/CER suites.' },
    { id: 'vision', name: 'Vision benchmarks', status: 'partial', kind: 'task', api: 'GET /v1/benchmark-platform/leaderboard', notes: 'Vision suite posture.' },
    { id: 'reasoning', name: 'Reasoning benchmarks', status: 'partial', kind: 'task', api: 'GET /v1/benchmark-platform/leaderboard', notes: 'Reasoning suite posture.' },
    { id: 'latency', name: 'Latency', status: 'shipped', kind: 'ops', api: 'GET /v1/benchmark-platform/leaderboard', notes: 'Latency measurement slots.' },
    { id: 'cost', name: 'Cost', status: 'shipped', kind: 'ops', api: 'GET /v1/benchmark-platform/leaderboard', notes: 'Cost-per-request slots.' },
    { id: 'energy', name: 'Energy efficiency', status: 'partial', kind: 'ops', api: null, notes: 'Energy tracking posture.' },
    { id: 'bias', name: 'Bias', status: 'shipped', kind: 'safety', api: 'GET /v1/benchmark-platform/leaderboard', notes: 'Bias suite slots.' },
    { id: 'fairness', name: 'Fairness', status: 'shipped', kind: 'safety', api: 'GET /v1/benchmark-platform/leaderboard', notes: 'Fairness suite slots.' },
    { id: 'safety', name: 'Safety', status: 'shipped', kind: 'safety', api: 'GET /v1/benchmark-platform/leaderboard', notes: 'Safety suite slots.' },
  ];
  const leaderboard: LeaderboardRow[] = [
    { id: 'lb-tr-001', suiteId: 'translation', modelLabel: 'research-mt-sw-yo-v0', score: 22.4, unit: 'bleu', notes: 'Internal seed — not public SOTA claim.' },
    { id: 'lb-sp-001', suiteId: 'speech', modelLabel: 'research-asr-sw-v0', score: 0.24, unit: 'wer', notes: 'Internal seed — lower is better.' },
    { id: 'lb-lat-001', suiteId: 'latency', modelLabel: 'research-mt-sw-yo-v0', score: 180, unit: 'ms_p95', notes: 'Internal latency seed.' },
    { id: 'lb-bias-001', suiteId: 'bias', modelLabel: 'research-chat-v0', score: 0.12, unit: 'bias_rate', notes: 'Internal bias seed — not market leadership.' },
  ];
  return {
    product: 'Lugemi Benchmark Platform',
    note:
      'Benchmark Platform (VL-274). Internal suites and leaderboard seed — not a public leaderboard OS and never claims market leadership or SOTA.',
    suites,
    leaderboard,
    capabilities: suites,
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to12: false,
      publicLeaderboardOs: false,
    },
    honesty: {
      regeneratesVolumes1to12: false,
      publicLeaderboardOs: false,
      sotaClaim: false,
      marketLeadershipClaim: false,
      coverageComplete: false,
    },
    docs: '/docs/BENCHMARK_PLATFORM.md',
  };
}
