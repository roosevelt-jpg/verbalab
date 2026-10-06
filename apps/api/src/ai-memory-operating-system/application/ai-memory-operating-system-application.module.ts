import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiMemoryOperatingSystemModule } from '../ai-memory-operating-system.module';
import { AI_MEMORY_OPERATING_SYSTEM_CATALOG_PORT } from './ports';
import { NestAiMemoryOperatingSystemCatalogAdapter } from './nest-ai-memory-operating-system.adapter';
import { AI_MEMORY_OPERATING_SYSTEM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AiMemoryOperatingSystemModule],
  providers: [
    NestAiMemoryOperatingSystemCatalogAdapter,
    { provide: AI_MEMORY_OPERATING_SYSTEM_CATALOG_PORT, useExisting: NestAiMemoryOperatingSystemCatalogAdapter },
    ...AI_MEMORY_OPERATING_SYSTEM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AiMemoryOperatingSystemApplicationModule {}
