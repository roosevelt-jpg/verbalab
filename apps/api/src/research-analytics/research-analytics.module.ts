import { Module } from '@nestjs/common';
import { ResearchAnalyticsController } from './research-analytics.controller';
import { ResearchAnalyticsService } from './research-analytics.service';

@Module({
  controllers: [ResearchAnalyticsController],
  providers: [ResearchAnalyticsService],
  exports: [ResearchAnalyticsService],
})
export class ResearchAnalyticsModule {}
