import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReleaseEngineeringEngineQuery, ListReleaseEngineeringProductsQuery } from './messages';
import {
  RELEASE_ENGINEERING_CATALOG_PORT,
  ReleaseEngineeringCatalogPort,
  ReleaseEngineeringEngineBundle,
  ReleaseEngineeringProductRow,
} from './ports';

@QueryHandler(GetReleaseEngineeringEngineQuery)
export class GetReleaseEngineeringEngineHandler
  implements IQueryHandler<GetReleaseEngineeringEngineQuery>
{
  constructor(
    @Inject(RELEASE_ENGINEERING_CATALOG_PORT)
    private readonly catalog: ReleaseEngineeringCatalogPort,
  ) {}

  execute(): Promise<ReleaseEngineeringEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListReleaseEngineeringProductsQuery)
export class ListReleaseEngineeringProductsHandler
  implements IQueryHandler<ListReleaseEngineeringProductsQuery>
{
  constructor(
    @Inject(RELEASE_ENGINEERING_CATALOG_PORT)
    private readonly catalog: ReleaseEngineeringCatalogPort,
  ) {}

  execute(): Promise<ReleaseEngineeringProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const RELEASE_ENGINEERING_HANDLERS = [GetReleaseEngineeringEngineHandler, ListReleaseEngineeringProductsHandler];
