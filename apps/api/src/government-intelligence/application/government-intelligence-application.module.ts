import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GovernmentIntelligenceModule } from '../government-intelligence.module';
import { GOVERNMENT_INTELLIGENCE_CATALOG_PORT } from './ports';
import { NestGovernmentIntelligenceCatalogAdapter } from './nest-government-intelligence.adapter';
import { GOVERNMENT_INTELLIGENCE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, GovernmentIntelligenceModule],
  providers: [
    NestGovernmentIntelligenceCatalogAdapter,
    { provide: GOVERNMENT_INTELLIGENCE_CATALOG_PORT, useExisting: NestGovernmentIntelligenceCatalogAdapter },
    ...GOVERNMENT_INTELLIGENCE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class GovernmentIntelligenceApplicationModule {}
