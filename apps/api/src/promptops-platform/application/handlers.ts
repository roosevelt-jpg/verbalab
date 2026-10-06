import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPromptopsPlatformEngineQuery, ListPromptopsPlatformProductsQuery } from './messages';
import {
  PROMPTOPS_PLATFORM_CATALOG_PORT,
  PromptopsPlatformCatalogPort,
  PromptopsPlatformEngineBundle,
  PromptopsPlatformProductRow,
} from './ports';

@QueryHandler(GetPromptopsPlatformEngineQuery)
export class GetPromptopsPlatformEngineHandler
  implements IQueryHandler<GetPromptopsPlatformEngineQuery>
{
  constructor(
    @Inject(PROMPTOPS_PLATFORM_CATALOG_PORT)
    private readonly catalog: PromptopsPlatformCatalogPort,
  ) {}

  execute: Promise<PromptopsPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListPromptopsPlatformProductsQuery)
export class ListPromptopsPlatformProductsHandler
  implements IQueryHandler<ListPromptopsPlatformProductsQuery>
{
  constructor(
    @Inject(PROMPTOPS_PLATFORM_CATALOG_PORT)
    private readonly catalog: PromptopsPlatformCatalogPort,
  ) {}

  execute: Promise<PromptopsPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const PROMPTOPS_PLATFORM_HANDLERS = [GetPromptopsPlatformEngineHandler, ListPromptopsPlatformProductsHandler];
