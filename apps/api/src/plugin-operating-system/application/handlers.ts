import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPluginOperatingSystemEngineQuery, ListPluginOperatingSystemProductsQuery } from './messages';
import {
  PLUGIN_OPERATING_SYSTEM_CATALOG_PORT,
  PluginOperatingSystemCatalogPort,
  PluginOperatingSystemEngineBundle,
  PluginOperatingSystemProductRow,
} from './ports';

@QueryHandler(GetPluginOperatingSystemEngineQuery)
export class GetPluginOperatingSystemEngineHandler
  implements IQueryHandler<GetPluginOperatingSystemEngineQuery>
{
  constructor(
    @Inject(PLUGIN_OPERATING_SYSTEM_CATALOG_PORT)
    private readonly catalog: PluginOperatingSystemCatalogPort,
  ) {}

  execute: Promise<PluginOperatingSystemEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListPluginOperatingSystemProductsQuery)
export class ListPluginOperatingSystemProductsHandler
  implements IQueryHandler<ListPluginOperatingSystemProductsQuery>
{
  constructor(
    @Inject(PLUGIN_OPERATING_SYSTEM_CATALOG_PORT)
    private readonly catalog: PluginOperatingSystemCatalogPort,
  ) {}

  execute: Promise<PluginOperatingSystemProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const PLUGIN_OPERATING_SYSTEM_HANDLERS = [GetPluginOperatingSystemEngineHandler, ListPluginOperatingSystemProductsHandler];
