import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ResearchCloudModule } from '../research-cloud.module';
import { RESEARCH_CLOUD_CATALOG_PORT } from './ports';
import { NestResearchCloudCatalogAdapter } from './nest-research-cloud.adapter';
import { RESEARCH_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ResearchCloudModule],
  providers: [
    NestResearchCloudCatalogAdapter,
    { provide: RESEARCH_CLOUD_CATALOG_PORT, useExisting: NestResearchCloudCatalogAdapter },
    ...RESEARCH_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ResearchCloudApplicationModule {}
