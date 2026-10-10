import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AfricanIntelligenceCloudModule } from '../african-intelligence-cloud.module';
import { AFRICAN_INTELLIGENCE_CLOUD_CATALOG_PORT } from './ports';
import { NestAfricanIntelligenceCloudCatalogAdapter } from './nest-african-intelligence-cloud.adapter';
import { AFRICAN_INTELLIGENCE_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AfricanIntelligenceCloudModule],
  providers: [
    NestAfricanIntelligenceCloudCatalogAdapter,
    { provide: AFRICAN_INTELLIGENCE_CLOUD_CATALOG_PORT, useExisting: NestAfricanIntelligenceCloudCatalogAdapter },
    ...AFRICAN_INTELLIGENCE_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AfricanIntelligenceCloudApplicationModule {}
