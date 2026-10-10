import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MemoryFabricModule } from '../memory-fabric.module';
import { MEMORY_FABRIC_CATALOG_PORT } from './ports';
import { NestMemoryFabricCatalogAdapter } from './nest-memory-fabric-catalog.adapter';
import { MEMORY_FABRIC_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, MemoryFabricModule],
  providers: [
    NestMemoryFabricCatalogAdapter,
    {
      provide: MEMORY_FABRIC_CATALOG_PORT,
      useExisting: NestMemoryFabricCatalogAdapter,
    },
    ...MEMORY_FABRIC_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class MemoryFabricApplicationModule {}
