import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAtlasEngineQuery, ListAtlasCapabilitiesQuery } from './messages';
import {
  ATLAS_CATALOG_PORT,
  AtlasCatalogPort,
  AtlasCapabilityRow,
  AtlasEngineBundle,
} from './ports';

@QueryHandler(ListAtlasCapabilitiesQuery)
export class ListAtlasCapabilitiesHandler
  implements IQueryHandler<ListAtlasCapabilitiesQuery>
{
  constructor(
    @Inject(ATLAS_CATALOG_PORT) private readonly catalog: AtlasCatalogPort,
  ) {}

  execute: Promise<AtlasCapabilityRow[]> {
    return Promise.resolve(this.catalog.listCapabilities);
  }
}

@QueryHandler(GetAtlasEngineQuery)
export class GetAtlasEngineHandler implements IQueryHandler<GetAtlasEngineQuery> {
  constructor(
    @Inject(ATLAS_CATALOG_PORT) private readonly catalog: AtlasCatalogPort,
  ) {}

  execute: Promise<AtlasEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

export const ATLAS_HANDLERS = [ListAtlasCapabilitiesHandler, GetAtlasEngineHandler];
