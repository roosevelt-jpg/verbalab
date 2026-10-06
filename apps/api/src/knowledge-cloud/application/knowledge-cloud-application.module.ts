import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { KnowledgeCloudModule } from '../knowledge-cloud.module';
import { KNOWLEDGE_CATALOG_PORT } from './ports';
import { NestKnowledgeCatalogAdapter } from './nest-knowledge-catalog.adapter';
import { KNOWLEDGE_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, KnowledgeCloudModule],
  providers: [
    NestKnowledgeCatalogAdapter,
    { provide: KNOWLEDGE_CATALOG_PORT, useExisting: NestKnowledgeCatalogAdapter },
    ...KNOWLEDGE_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class KnowledgeCloudApplicationModule {}
