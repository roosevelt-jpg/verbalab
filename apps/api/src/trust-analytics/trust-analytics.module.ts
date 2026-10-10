import { Module } from '@nestjs/common';
import { TrustAnalyticsController } from './trust-analytics.controller';
import { TrustAnalyticsService } from './trust-analytics.service';

@Module({
  controllers: [TrustAnalyticsController],
  providers: [TrustAnalyticsService],
  exports: [TrustAnalyticsService],
})
export class TrustAnalyticsModule {}
