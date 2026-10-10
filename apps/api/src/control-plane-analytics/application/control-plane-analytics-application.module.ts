import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ControlPlaneAnalyticsModule } from '../control-plane-analytics.module';
import { CONTROL_PLANE_ANALYTICS_CATALOG_PORT } from './ports';
import { NestControlPlaneAnalyticsCatalogAdapter } from './nest-control-plane-analytics.adapter';
import { CONTROL_PLANE_ANALYTICS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ControlPlaneAnalyticsModule],
  providers: [
    NestControlPlaneAnalyticsCatalogAdapter,
    { provide: CONTROL_PLANE_ANALYTICS_CATALOG_PORT, useExisting: NestControlPlaneAnalyticsCatalogAdapter },
    ...CONTROL_PLANE_ANALYTICS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ControlPlaneAnalyticsApplicationModule {}
