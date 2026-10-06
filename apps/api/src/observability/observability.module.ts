import { Module } from '@nestjs/common';
import { TranslateLatencyService } from './translate-latency.service';
import { MetricsController } from './metrics.controller';

@Module({
  providers: [TranslateLatencyService],
  controllers: [MetricsController],
  exports: [TranslateLatencyService],
})
export class ObservabilityModule {}
