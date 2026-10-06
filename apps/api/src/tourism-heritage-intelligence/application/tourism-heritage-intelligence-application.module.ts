import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TourismHeritageIntelligenceModule } from '../tourism-heritage-intelligence.module';
import { TOURISM_HERITAGE_INTELLIGENCE_CATALOG_PORT } from './ports';
import { NestTourismHeritageIntelligenceCatalogAdapter } from './nest-tourism-heritage-intelligence.adapter';
import { TOURISM_HERITAGE_INTELLIGENCE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, TourismHeritageIntelligenceModule],
  providers: [
    NestTourismHeritageIntelligenceCatalogAdapter,
    { provide: TOURISM_HERITAGE_INTELLIGENCE_CATALOG_PORT, useExisting: NestTourismHeritageIntelligenceCatalogAdapter },
    ...TOURISM_HERITAGE_INTELLIGENCE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class TourismHeritageIntelligenceApplicationModule {}
