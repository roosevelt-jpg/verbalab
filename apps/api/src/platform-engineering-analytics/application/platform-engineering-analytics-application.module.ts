import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PlatformEngineeringAnalyticsModule } from '../platform-engineering-analytics.module';
import { PLATFORM_ENGINEERING_ANALYTICS_CATALOG_PORT } from './ports';
import { NestPlatformEngineeringAnalyticsCatalogAdapter } from './nest-platform-engineering-analytics.adapter';
import { PLATFORM_ENGINEERING_ANALYTICS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, PlatformEngineeringAnalyticsModule],
  providers: [
    NestPlatformEngineeringAnalyticsCatalogAdapter,
    { provide: PLATFORM_ENGINEERING_ANALYTICS_CATALOG_PORT, useExisting: NestPlatformEngineeringAnalyticsCatalogAdapter },
    ...PLATFORM_ENGINEERING_ANALYTICS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class PlatformEngineeringAnalyticsApplicationModule {}
