import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PromptMarketplaceModule } from '../prompt-marketplace.module';
import { PROMPT_MARKETPLACE_CATALOG_PORT } from './ports';
import { NestPromptMarketplaceCatalogAdapter } from './nest-prompt-marketplace-catalog.adapter';
import { PROMPT_MARKETPLACE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, PromptMarketplaceModule],
  providers: [
    NestPromptMarketplaceCatalogAdapter,
    {
      provide: PROMPT_MARKETPLACE_CATALOG_PORT,
      useExisting: NestPromptMarketplaceCatalogAdapter,
    },
    ...PROMPT_MARKETPLACE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class PromptMarketplaceApplicationModule {}
