import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PromptFabricModule } from '../prompt-fabric.module';
import { PROMPT_FABRIC_CATALOG_PORT } from './ports';
import { NestPromptFabricCatalogAdapter } from './nest-prompt-fabric-catalog.adapter';
import { PROMPT_FABRIC_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, PromptFabricModule],
  providers: [
    NestPromptFabricCatalogAdapter,
    { provide: PROMPT_FABRIC_CATALOG_PORT, useExisting: NestPromptFabricCatalogAdapter },
    ...PROMPT_FABRIC_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class PromptFabricApplicationModule {}
