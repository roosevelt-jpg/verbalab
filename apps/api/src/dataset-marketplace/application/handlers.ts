import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDatasetMarketplaceEngineQuery } from './messages';
import {
  DATASET_MARKETPLACE_CATALOG_PORT,
  DatasetMarketplaceCatalogPort,
  DatasetMarketplaceEngineBundle,
} from './ports';

@QueryHandler(GetDatasetMarketplaceEngineQuery)
export class GetDatasetMarketplaceEngineHandler
  implements IQueryHandler<GetDatasetMarketplaceEngineQuery>
{
  constructor(
    @Inject(DATASET_MARKETPLACE_CATALOG_PORT)
    private readonly catalog: DatasetMarketplaceCatalogPort,
  ) {}

  execute: Promise<DatasetMarketplaceEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

export const DATASET_MARKETPLACE_HANDLERS = [GetDatasetMarketplaceEngineHandler];
