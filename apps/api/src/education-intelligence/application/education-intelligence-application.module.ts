import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EducationIntelligenceModule } from '../education-intelligence.module';
import { EDUCATION_INTELLIGENCE_CATALOG_PORT } from './ports';
import { NestEducationIntelligenceCatalogAdapter } from './nest-education-intelligence.adapter';
import { EDUCATION_INTELLIGENCE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, EducationIntelligenceModule],
  providers: [
    NestEducationIntelligenceCatalogAdapter,
    { provide: EDUCATION_INTELLIGENCE_CATALOG_PORT, useExisting: NestEducationIntelligenceCatalogAdapter },
    ...EDUCATION_INTELLIGENCE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class EducationIntelligenceApplicationModule {}
