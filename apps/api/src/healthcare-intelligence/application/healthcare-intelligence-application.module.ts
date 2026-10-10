import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HealthcareIntelligenceModule } from '../healthcare-intelligence.module';
import { HEALTHCARE_INTELLIGENCE_CATALOG_PORT } from './ports';
import { NestHealthcareIntelligenceCatalogAdapter } from './nest-healthcare-intelligence.adapter';
import { HEALTHCARE_INTELLIGENCE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, HealthcareIntelligenceModule],
  providers: [
    NestHealthcareIntelligenceCatalogAdapter,
    { provide: HEALTHCARE_INTELLIGENCE_CATALOG_PORT, useExisting: NestHealthcareIntelligenceCatalogAdapter },
    ...HEALTHCARE_INTELLIGENCE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class HealthcareIntelligenceApplicationModule {}
