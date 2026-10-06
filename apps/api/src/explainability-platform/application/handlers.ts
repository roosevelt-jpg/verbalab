import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetExplainabilityPlatformEngineQuery, ListExplainabilityPlatformProductsQuery } from './messages';
import {
  EXPLAINABILITY_PLATFORM_CATALOG_PORT,
  ExplainabilityPlatformCatalogPort,
  ExplainabilityPlatformEngineBundle,
  ExplainabilityPlatformProductRow,
} from './ports';

@QueryHandler(GetExplainabilityPlatformEngineQuery)
export class GetExplainabilityPlatformEngineHandler
  implements IQueryHandler<GetExplainabilityPlatformEngineQuery>
{
  constructor(
    @Inject(EXPLAINABILITY_PLATFORM_CATALOG_PORT)
    private readonly catalog: ExplainabilityPlatformCatalogPort,
  ) {}

  execute(): Promise<ExplainabilityPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListExplainabilityPlatformProductsQuery)
export class ListExplainabilityPlatformProductsHandler
  implements IQueryHandler<ListExplainabilityPlatformProductsQuery>
{
  constructor(
    @Inject(EXPLAINABILITY_PLATFORM_CATALOG_PORT)
    private readonly catalog: ExplainabilityPlatformCatalogPort,
  ) {}

  execute(): Promise<ExplainabilityPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const EXPLAINABILITY_PLATFORM_HANDLERS = [GetExplainabilityPlatformEngineHandler, ListExplainabilityPlatformProductsHandler];
