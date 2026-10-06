import { Injectable } from '@nestjs/common';

export type LatencySnapshot = {
  samples: number;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  maxMs: number | null;
};

/**
 * In-process rolling window of translate latencies for SLA-style p95.
 * Not a metrics cloud — single instance only.
 */
@Injectable()
export class TranslateLatencyService {
  private readonly samples: number[] = [];
  private readonly capacity: number;

  constructor() {
    const raw = Number(process.env.TRANSLATE_LATENCY_SAMPLES ?? 1000);
    this.capacity = Number.isFinite(raw) && raw > 10 ? Math.floor(raw) : 1000;
  }

  record(latencyMs: number) {
    if (!Number.isFinite(latencyMs) || latencyMs < 0) return;
    this.samples.push(Math.round(latencyMs));
    if (this.samples.length > this.capacity) {
      this.samples.splice(0, this.samples.length - this.capacity);
    }
  }

  private percentile(sorted: number[], p: number): number | null {
    if (sorted.length === 0) return null;
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[idx] ?? null;
  }

  snapshot(): LatencySnapshot {
    if (this.samples.length === 0) {
      return { samples: 0, p50Ms: null, p95Ms: null, p99Ms: null, maxMs: null };
    }
    const sorted = [...this.samples].sort((a, b) => a - b);
    return {
      samples: sorted.length,
      p50Ms: this.percentile(sorted, 50),
      p95Ms: this.percentile(sorted, 95),
      p99Ms: this.percentile(sorted, 99),
      maxMs: sorted[sorted.length - 1] ?? null,
    };
  }
}
