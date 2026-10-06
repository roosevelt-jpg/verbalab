import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ReasoningFabricModule } from '../reasoning-fabric.module';
import { REASONING_FABRIC_CATALOG_PORT } from './ports';
import { NestReasoningFabricCatalogAdapter } from './nest-reasoning-fabric-catalog.adapter';
import { REASONING_FABRIC_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ReasoningFabricModule],
  providers: [
    NestReasoningFabricCatalogAdapter,
    {
      provide: REASONING_FABRIC_CATALOG_PORT,
      useExisting: NestReasoningFabricCatalogAdapter,
    },
    ...REASONING_FABRIC_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ReasoningFabricApplicationModule {}
