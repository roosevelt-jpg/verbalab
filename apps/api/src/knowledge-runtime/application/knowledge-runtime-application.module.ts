import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { KnowledgeRuntimeModule } from '../knowledge-runtime.module';
import { KNOWLEDGE_RUNTIME_CATALOG_PORT } from './ports';
import { NestKnowledgeRuntimeCatalogAdapter } from './nest-knowledge-runtime.adapter';
import { KNOWLEDGE_RUNTIME_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, KnowledgeRuntimeModule],
  providers: [
    NestKnowledgeRuntimeCatalogAdapter,
    { provide: KNOWLEDGE_RUNTIME_CATALOG_PORT, useExisting: NestKnowledgeRuntimeCatalogAdapter },
    ...KNOWLEDGE_RUNTIME_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class KnowledgeRuntimeApplicationModule {}
