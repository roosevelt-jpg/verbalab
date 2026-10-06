import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AfricanKnowledgeGraphModule } from '../african-knowledge-graph.module';
import { AFRICAN_KNOWLEDGE_GRAPH_CATALOG_PORT } from './ports';
import { NestAfricanKnowledgeGraphCatalogAdapter } from './nest-african-knowledge-graph.adapter';
import { AFRICAN_KNOWLEDGE_GRAPH_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AfricanKnowledgeGraphModule],
  providers: [
    NestAfricanKnowledgeGraphCatalogAdapter,
    { provide: AFRICAN_KNOWLEDGE_GRAPH_CATALOG_PORT, useExisting: NestAfricanKnowledgeGraphCatalogAdapter },
    ...AFRICAN_KNOWLEDGE_GRAPH_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AfricanKnowledgeGraphApplicationModule {}
