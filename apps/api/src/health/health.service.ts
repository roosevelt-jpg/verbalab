import { Injectable } from '@nestjs/common';
import { TranslateLatencyService } from '../observability/translate-latency.service';
import { currentRegionCode, findRegion } from '../regions/regions.catalog';

@Injectable
export class HealthService {
  constructor(private readonly translateLatency: TranslateLatencyService) {}

  getStatus {
    const code = currentRegionCode;
    const def = findRegion(code);
    return {
      status: 'ok' as const,
      region: code,
      flyRegion: def?.flyRegion ?? null,
      translateLatency: this.translateLatency.snapshot,
    };
  }
}
