import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IntelligenceCloudModule } from '../intelligence-cloud.module';
import { INTELLIGENCE_CATALOG_PORT } from './ports';
import { NestIntelligenceCatalogAdapter } from './nest-intelligence-catalog.adapter';
import { INTELLIGENCE_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, IntelligenceCloudModule],
  providers: [
    NestIntelligenceCatalogAdapter,
    { provide: INTELLIGENCE_CATALOG_PORT, useExisting: NestIntelligenceCatalogAdapter },
    ...INTELLIGENCE_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class IntelligenceCloudApplicationModule {}
