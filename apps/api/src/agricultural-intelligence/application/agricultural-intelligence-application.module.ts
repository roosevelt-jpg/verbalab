import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AgriculturalIntelligenceModule } from '../agricultural-intelligence.module';
import { AGRICULTURAL_INTELLIGENCE_CATALOG_PORT } from './ports';
import { NestAgriculturalIntelligenceCatalogAdapter } from './nest-agricultural-intelligence.adapter';
import { AGRICULTURAL_INTELLIGENCE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AgriculturalIntelligenceModule],
  providers: [
    NestAgriculturalIntelligenceCatalogAdapter,
    { provide: AGRICULTURAL_INTELLIGENCE_CATALOG_PORT, useExisting: NestAgriculturalIntelligenceCatalogAdapter },
    ...AGRICULTURAL_INTELLIGENCE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AgriculturalIntelligenceApplicationModule {}
