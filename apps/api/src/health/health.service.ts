import { Injectable } from '@nestjs/common';
import { TranslateLatencyService } from '../observability/translate-latency.service';
import { PrismaService } from '../prisma/prisma.service';
import { currentRegionCode, findRegion } from '../regions/regions.catalog';

@Injectable()
export class HealthService {
  constructor(
    private readonly translateLatency: TranslateLatencyService,
    private readonly prisma: PrismaService,
  ) {}

  getStatus() {
    const code = currentRegionCode();
    const def = findRegion(code);
    return {
      status: 'ok' as const,
      region: code,
      flyRegion: def?.flyRegion ?? null,
      database: this.prisma.isReady() ? ('ready' as const) : ('skipped' as const),
      translateLatency: this.translateLatency.snapshot(),
    };
  }
}
