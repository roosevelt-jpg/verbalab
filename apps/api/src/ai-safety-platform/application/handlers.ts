import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAiSafetyPlatformEngineQuery, ListAiSafetyPlatformProductsQuery } from './messages';
import {
  AI_SAFETY_PLATFORM_CATALOG_PORT,
  AiSafetyPlatformCatalogPort,
  AiSafetyPlatformEngineBundle,
  AiSafetyPlatformProductRow,
} from './ports';

@QueryHandler(GetAiSafetyPlatformEngineQuery)
export class GetAiSafetyPlatformEngineHandler
  implements IQueryHandler<GetAiSafetyPlatformEngineQuery>
{
  constructor(
    @Inject(AI_SAFETY_PLATFORM_CATALOG_PORT)
    private readonly catalog: AiSafetyPlatformCatalogPort,
  ) {}

  execute(): Promise<AiSafetyPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListAiSafetyPlatformProductsQuery)
export class ListAiSafetyPlatformProductsHandler
  implements IQueryHandler<ListAiSafetyPlatformProductsQuery>
{
  constructor(
    @Inject(AI_SAFETY_PLATFORM_CATALOG_PORT)
    private readonly catalog: AiSafetyPlatformCatalogPort,
  ) {}

  execute(): Promise<AiSafetyPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const AI_SAFETY_PLATFORM_HANDLERS = [GetAiSafetyPlatformEngineHandler, ListAiSafetyPlatformProductsHandler];
