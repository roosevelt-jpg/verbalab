import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiFabricModule } from '../ai-fabric.module';
import { AI_FABRIC_CATALOG_PORT } from './ports';
import { NestAiFabricCatalogAdapter } from './nest-ai-fabric-catalog.adapter';
import { AI_FABRIC_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AiFabricModule],
  providers: [
    NestAiFabricCatalogAdapter,
    { provide: AI_FABRIC_CATALOG_PORT, useExisting: NestAiFabricCatalogAdapter },
    ...AI_FABRIC_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AiFabricApplicationModule {}
