import { estimateFeatureCostUsd, roundUsd } from '../src/analytics/analytics-cost';

describe('Analytics cost helpers', () => {
  it('computes per-feature estimates', () => {
    expect(roundUsd(estimateFeatureCostUsd('translate', 5000))).toBe(0.1);
    expect(roundUsd(estimateFeatureCostUsd('ocr', 10))).toBe(0.02);
    expect(estimateFeatureCostUsd('unknown', 100)).toBe(0);
  });
});
