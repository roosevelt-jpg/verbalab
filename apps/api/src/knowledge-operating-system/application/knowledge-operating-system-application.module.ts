import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { KnowledgeOperatingSystemModule } from '../knowledge-operating-system.module';
import { KNOWLEDGE_OPERATING_SYSTEM_CATALOG_PORT } from './ports';
import { NestKnowledgeOperatingSystemCatalogAdapter } from './nest-knowledge-operating-system.adapter';
import { KNOWLEDGE_OPERATING_SYSTEM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, KnowledgeOperatingSystemModule],
  providers: [
    NestKnowledgeOperatingSystemCatalogAdapter,
    { provide: KNOWLEDGE_OPERATING_SYSTEM_CATALOG_PORT, useExisting: NestKnowledgeOperatingSystemCatalogAdapter },
    ...KNOWLEDGE_OPERATING_SYSTEM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class KnowledgeOperatingSystemApplicationModule {}
