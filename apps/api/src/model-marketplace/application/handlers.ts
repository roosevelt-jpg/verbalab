import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetModelMarketplaceEngineQuery } from './messages';
import {
  MODEL_MARKETPLACE_CATALOG_PORT,
  ModelMarketplaceCatalogPort,
  ModelMarketplaceEngineBundle,
} from './ports';

@QueryHandler(GetModelMarketplaceEngineQuery)
export class GetModelMarketplaceEngineHandler
  implements IQueryHandler<GetModelMarketplaceEngineQuery>
{
  constructor(
    @Inject(MODEL_MARKETPLACE_CATALOG_PORT)
    private readonly catalog: ModelMarketplaceCatalogPort,
  ) {}

  execute: Promise<ModelMarketplaceEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

export const MODEL_MARKETPLACE_HANDLERS = [GetModelMarketplaceEngineHandler];
