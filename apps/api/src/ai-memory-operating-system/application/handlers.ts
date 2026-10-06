import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAiMemoryOperatingSystemEngineQuery, ListAiMemoryOperatingSystemProductsQuery } from './messages';
import {
  AI_MEMORY_OPERATING_SYSTEM_CATALOG_PORT,
  AiMemoryOperatingSystemCatalogPort,
  AiMemoryOperatingSystemEngineBundle,
  AiMemoryOperatingSystemProductRow,
} from './ports';

@QueryHandler(GetAiMemoryOperatingSystemEngineQuery)
export class GetAiMemoryOperatingSystemEngineHandler
  implements IQueryHandler<GetAiMemoryOperatingSystemEngineQuery>
{
  constructor(
    @Inject(AI_MEMORY_OPERATING_SYSTEM_CATALOG_PORT)
    private readonly catalog: AiMemoryOperatingSystemCatalogPort,
  ) {}

  execute: Promise<AiMemoryOperatingSystemEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListAiMemoryOperatingSystemProductsQuery)
export class ListAiMemoryOperatingSystemProductsHandler
  implements IQueryHandler<ListAiMemoryOperatingSystemProductsQuery>
{
  constructor(
    @Inject(AI_MEMORY_OPERATING_SYSTEM_CATALOG_PORT)
    private readonly catalog: AiMemoryOperatingSystemCatalogPort,
  ) {}

  execute: Promise<AiMemoryOperatingSystemProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const AI_MEMORY_OPERATING_SYSTEM_HANDLERS = [GetAiMemoryOperatingSystemEngineHandler, ListAiMemoryOperatingSystemProductsHandler];
