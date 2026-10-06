import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CulturalIntelligenceModule } from '../cultural-intelligence.module';
import { CULTURAL_INTELLIGENCE_CATALOG_PORT } from './ports';
import { NestCulturalIntelligenceCatalogAdapter } from './nest-cultural-intelligence.adapter';
import { CULTURAL_INTELLIGENCE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, CulturalIntelligenceModule],
  providers: [
    NestCulturalIntelligenceCatalogAdapter,
    { provide: CULTURAL_INTELLIGENCE_CATALOG_PORT, useExisting: NestCulturalIntelligenceCatalogAdapter },
    ...CULTURAL_INTELLIGENCE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class CulturalIntelligenceApplicationModule {}
