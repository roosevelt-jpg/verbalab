import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ResearchAnalyticsModule } from '../research-analytics.module';
import { RESEARCH_ANALYTICS_CATALOG_PORT } from './ports';
import { NestResearchAnalyticsCatalogAdapter } from './nest-research-analytics.adapter';
import { RESEARCH_ANALYTICS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ResearchAnalyticsModule],
  providers: [
    NestResearchAnalyticsCatalogAdapter,
    { provide: RESEARCH_ANALYTICS_CATALOG_PORT, useExisting: NestResearchAnalyticsCatalogAdapter },
    ...RESEARCH_ANALYTICS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ResearchAnalyticsApplicationModule {}
