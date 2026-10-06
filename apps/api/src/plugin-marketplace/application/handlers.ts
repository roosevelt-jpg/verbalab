import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPluginMarketplaceEngineQuery } from './messages';
import {
  PLUGIN_MARKETPLACE_CATALOG_PORT,
  PluginMarketplaceCatalogPort,
  PluginMarketplaceEngineBundle,
} from './ports';

@QueryHandler(GetPluginMarketplaceEngineQuery)
export class GetPluginMarketplaceEngineHandler
  implements IQueryHandler<GetPluginMarketplaceEngineQuery>
{
  constructor(
    @Inject(PLUGIN_MARKETPLACE_CATALOG_PORT)
    private readonly catalog: PluginMarketplaceCatalogPort,
  ) {}

  execute: Promise<PluginMarketplaceEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

export const PLUGIN_MARKETPLACE_HANDLERS = [GetPluginMarketplaceEngineHandler];
