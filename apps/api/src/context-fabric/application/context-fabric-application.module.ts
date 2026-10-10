import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ContextFabricModule } from '../context-fabric.module';
import { CONTEXT_FABRIC_CATALOG_PORT } from './ports';
import { NestContextFabricCatalogAdapter } from './nest-context-fabric-catalog.adapter';
import { CONTEXT_FABRIC_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ContextFabricModule],
  providers: [
    NestContextFabricCatalogAdapter,
    { provide: CONTEXT_FABRIC_CATALOG_PORT, useExisting: NestContextFabricCatalogAdapter },
    ...CONTEXT_FABRIC_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ContextFabricApplicationModule {}
