import { Module } from '@nestjs/common';
import { ControlPlaneAnalyticsController } from './control-plane-analytics.controller';
import { ControlPlaneAnalyticsService } from './control-plane-analytics.service';

@Module({
  controllers: [ControlPlaneAnalyticsController],
  providers: [ControlPlaneAnalyticsService],
  exports: [ControlPlaneAnalyticsService],
})
export class ControlPlaneAnalyticsModule {}
