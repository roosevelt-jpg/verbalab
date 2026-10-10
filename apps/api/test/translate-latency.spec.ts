import { describe, expect, it } from 'vitest';
import { TranslateLatencyService } from '../src/observability/translate-latency.service';

describe('TranslateLatencyService', () => {
  it('computes percentiles from recorded samples', () => {
    const svc = new TranslateLatencyService();
    for (let i = 1; i <= 100; i++) {
      svc.record(i);
    }
    const snap = svc.snapshot();
    expect(snap.samples).toBe(100);
    expect(snap.p50Ms).toBe(50);
    expect(snap.p95Ms).toBe(95);
    expect(snap.p99Ms).toBe(99);
    expect(snap.maxMs).toBe(100);
  });
});
