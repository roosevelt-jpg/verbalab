import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetFinopsPlatformEngineQuery, ListFinopsPlatformProductsQuery } from './messages';
import {
  FINOPS_PLATFORM_CATALOG_PORT,
  FinopsPlatformCatalogPort,
  FinopsPlatformEngineBundle,
  FinopsPlatformProductRow,
} from './ports';

@QueryHandler(GetFinopsPlatformEngineQuery)
export class GetFinopsPlatformEngineHandler
  implements IQueryHandler<GetFinopsPlatformEngineQuery>
{
  constructor(
    @Inject(FINOPS_PLATFORM_CATALOG_PORT)
    private readonly catalog: FinopsPlatformCatalogPort,
  ) {}

  execute(): Promise<FinopsPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListFinopsPlatformProductsQuery)
export class ListFinopsPlatformProductsHandler
  implements IQueryHandler<ListFinopsPlatformProductsQuery>
{
  constructor(
    @Inject(FINOPS_PLATFORM_CATALOG_PORT)
    private readonly catalog: FinopsPlatformCatalogPort,
  ) {}

  execute(): Promise<FinopsPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const FINOPS_PLATFORM_HANDLERS = [GetFinopsPlatformEngineHandler, ListFinopsPlatformProductsHandler];
