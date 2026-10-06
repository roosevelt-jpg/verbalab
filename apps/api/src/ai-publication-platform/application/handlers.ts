import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAiPublicationPlatformEngineQuery, ListAiPublicationPlatformProductsQuery } from './messages';
import {
  AI_PUBLICATION_PLATFORM_CATALOG_PORT,
  AiPublicationPlatformCatalogPort,
  AiPublicationPlatformEngineBundle,
  AiPublicationPlatformProductRow,
} from './ports';

@QueryHandler(GetAiPublicationPlatformEngineQuery)
export class GetAiPublicationPlatformEngineHandler
  implements IQueryHandler<GetAiPublicationPlatformEngineQuery>
{
  constructor(
    @Inject(AI_PUBLICATION_PLATFORM_CATALOG_PORT)
    private readonly catalog: AiPublicationPlatformCatalogPort,
  ) {}

  execute: Promise<AiPublicationPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListAiPublicationPlatformProductsQuery)
export class ListAiPublicationPlatformProductsHandler
  implements IQueryHandler<ListAiPublicationPlatformProductsQuery>
{
  constructor(
    @Inject(AI_PUBLICATION_PLATFORM_CATALOG_PORT)
    private readonly catalog: AiPublicationPlatformCatalogPort,
  ) {}

  execute: Promise<AiPublicationPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const AI_PUBLICATION_PLATFORM_HANDLERS = [GetAiPublicationPlatformEngineHandler, ListAiPublicationPlatformProductsHandler];
