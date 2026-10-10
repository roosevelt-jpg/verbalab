import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatasetMarketplaceModule } from '../dataset-marketplace.module';
import { DATASET_MARKETPLACE_CATALOG_PORT } from './ports';
import { NestDatasetMarketplaceCatalogAdapter } from './nest-dataset-marketplace-catalog.adapter';
import { DATASET_MARKETPLACE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, DatasetMarketplaceModule],
  providers: [
    NestDatasetMarketplaceCatalogAdapter,
    {
      provide: DATASET_MARKETPLACE_CATALOG_PORT,
      useExisting: NestDatasetMarketplaceCatalogAdapter,
    },
    ...DATASET_MARKETPLACE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class DatasetMarketplaceApplicationModule {}
