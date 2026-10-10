import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ModelMarketplaceModule } from '../model-marketplace.module';
import { MODEL_MARKETPLACE_CATALOG_PORT } from './ports';
import { NestModelMarketplaceCatalogAdapter } from './nest-model-marketplace-catalog.adapter';
import { MODEL_MARKETPLACE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ModelMarketplaceModule],
  providers: [
    NestModelMarketplaceCatalogAdapter,
    {
      provide: MODEL_MARKETPLACE_CATALOG_PORT,
      useExisting: NestModelMarketplaceCatalogAdapter,
    },
    ...MODEL_MARKETPLACE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ModelMarketplaceApplicationModule {}
