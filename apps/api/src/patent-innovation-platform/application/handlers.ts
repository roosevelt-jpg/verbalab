import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPatentInnovationPlatformEngineQuery, ListPatentInnovationPlatformProductsQuery } from './messages';
import {
  PATENT_INNOVATION_PLATFORM_CATALOG_PORT,
  PatentInnovationPlatformCatalogPort,
  PatentInnovationPlatformEngineBundle,
  PatentInnovationPlatformProductRow,
} from './ports';

@QueryHandler(GetPatentInnovationPlatformEngineQuery)
export class GetPatentInnovationPlatformEngineHandler
  implements IQueryHandler<GetPatentInnovationPlatformEngineQuery>
{
  constructor(
    @Inject(PATENT_INNOVATION_PLATFORM_CATALOG_PORT)
    private readonly catalog: PatentInnovationPlatformCatalogPort,
  ) {}

  execute: Promise<PatentInnovationPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListPatentInnovationPlatformProductsQuery)
export class ListPatentInnovationPlatformProductsHandler
  implements IQueryHandler<ListPatentInnovationPlatformProductsQuery>
{
  constructor(
    @Inject(PATENT_INNOVATION_PLATFORM_CATALOG_PORT)
    private readonly catalog: PatentInnovationPlatformCatalogPort,
  ) {}

  execute: Promise<PatentInnovationPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const PATENT_INNOVATION_PLATFORM_HANDLERS = [GetPatentInnovationPlatformEngineHandler, ListPatentInnovationPlatformProductsHandler];
