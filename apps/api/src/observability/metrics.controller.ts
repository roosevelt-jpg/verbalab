import { Controller, Get } from '@nestjs/common';
import { TranslateLatencyService } from './translate-latency.service';

@Controller('v1/metrics')
export class MetricsController {
  constructor(private readonly translateLatency: TranslateLatencyService) {}

  /** In-process translate latency percentiles (single instance). */
  @Get('translate')
  translate() {
    return {
      feature: 'translate',
      ...this.translateLatency.snapshot(),
    };
  }
}
