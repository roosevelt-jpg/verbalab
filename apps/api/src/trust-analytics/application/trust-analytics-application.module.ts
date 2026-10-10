import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TrustAnalyticsModule } from '../trust-analytics.module';
import { TRUST_ANALYTICS_CATALOG_PORT } from './ports';
import { NestTrustAnalyticsCatalogAdapter } from './nest-trust-analytics.adapter';
import { TRUST_ANALYTICS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, TrustAnalyticsModule],
  providers: [
    NestTrustAnalyticsCatalogAdapter,
    { provide: TRUST_ANALYTICS_CATALOG_PORT, useExisting: NestTrustAnalyticsCatalogAdapter },
    ...TRUST_ANALYTICS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class TrustAnalyticsApplicationModule {}
