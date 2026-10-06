import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetRagopsPlatformEngineQuery, ListRagopsPlatformProductsQuery } from './messages';
import {
  RAGOPS_PLATFORM_CATALOG_PORT,
  RagopsPlatformCatalogPort,
  RagopsPlatformEngineBundle,
  RagopsPlatformProductRow,
} from './ports';

@QueryHandler(GetRagopsPlatformEngineQuery)
export class GetRagopsPlatformEngineHandler
  implements IQueryHandler<GetRagopsPlatformEngineQuery>
{
  constructor(
    @Inject(RAGOPS_PLATFORM_CATALOG_PORT)
    private readonly catalog: RagopsPlatformCatalogPort,
  ) {}

  execute(): Promise<RagopsPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListRagopsPlatformProductsQuery)
export class ListRagopsPlatformProductsHandler
  implements IQueryHandler<ListRagopsPlatformProductsQuery>
{
  constructor(
    @Inject(RAGOPS_PLATFORM_CATALOG_PORT)
    private readonly catalog: RagopsPlatformCatalogPort,
  ) {}

  execute(): Promise<RagopsPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const RAGOPS_PLATFORM_HANDLERS = [GetRagopsPlatformEngineHandler, ListRagopsPlatformProductsHandler];
