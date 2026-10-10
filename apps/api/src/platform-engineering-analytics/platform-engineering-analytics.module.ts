import { Module } from '@nestjs/common';
import { PlatformEngineeringAnalyticsController } from './platform-engineering-analytics.controller';
import { PlatformEngineeringAnalyticsService } from './platform-engineering-analytics.service';

@Module({
  controllers: [PlatformEngineeringAnalyticsController],
  providers: [PlatformEngineeringAnalyticsService],
  exports: [PlatformEngineeringAnalyticsService],
})
export class PlatformEngineeringAnalyticsModule {}
