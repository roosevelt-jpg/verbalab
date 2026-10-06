import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { KnowledgeFabricModule } from '../knowledge-fabric.module';
import { KNOWLEDGE_FABRIC_CATALOG_PORT } from './ports';
import { NestKnowledgeFabricCatalogAdapter } from './nest-knowledge-fabric-catalog.adapter';
import { KNOWLEDGE_FABRIC_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, KnowledgeFabricModule],
  providers: [
    NestKnowledgeFabricCatalogAdapter,
    {
      provide: KNOWLEDGE_FABRIC_CATALOG_PORT,
      useExisting: NestKnowledgeFabricCatalogAdapter,
    },
    ...KNOWLEDGE_FABRIC_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class KnowledgeFabricApplicationModule {}
