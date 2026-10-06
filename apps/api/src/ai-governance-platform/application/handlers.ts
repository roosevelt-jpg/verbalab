import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAiGovernancePlatformEngineQuery, ListAiGovernancePlatformProductsQuery } from './messages';
import {
  AI_GOVERNANCE_PLATFORM_CATALOG_PORT,
  AiGovernancePlatformCatalogPort,
  AiGovernancePlatformEngineBundle,
  AiGovernancePlatformProductRow,
} from './ports';

@QueryHandler(GetAiGovernancePlatformEngineQuery)
export class GetAiGovernancePlatformEngineHandler
  implements IQueryHandler<GetAiGovernancePlatformEngineQuery>
{
  constructor(
    @Inject(AI_GOVERNANCE_PLATFORM_CATALOG_PORT)
    private readonly catalog: AiGovernancePlatformCatalogPort,
  ) {}

  execute(): Promise<AiGovernancePlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListAiGovernancePlatformProductsQuery)
export class ListAiGovernancePlatformProductsHandler
  implements IQueryHandler<ListAiGovernancePlatformProductsQuery>
{
  constructor(
    @Inject(AI_GOVERNANCE_PLATFORM_CATALOG_PORT)
    private readonly catalog: AiGovernancePlatformCatalogPort,
  ) {}

  execute(): Promise<AiGovernancePlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const AI_GOVERNANCE_PLATFORM_HANDLERS = [GetAiGovernancePlatformEngineHandler, ListAiGovernancePlatformProductsHandler];
