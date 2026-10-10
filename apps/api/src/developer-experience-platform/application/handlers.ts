import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDeveloperExperiencePlatformEngineQuery, ListDeveloperExperiencePlatformProductsQuery } from './messages';
import {
  DEVELOPER_EXPERIENCE_PLATFORM_CATALOG_PORT,
  DeveloperExperiencePlatformCatalogPort,
  DeveloperExperiencePlatformEngineBundle,
  DeveloperExperiencePlatformProductRow,
} from './ports';

@QueryHandler(GetDeveloperExperiencePlatformEngineQuery)
export class GetDeveloperExperiencePlatformEngineHandler
  implements IQueryHandler<GetDeveloperExperiencePlatformEngineQuery>
{
  constructor(
    @Inject(DEVELOPER_EXPERIENCE_PLATFORM_CATALOG_PORT)
    private readonly catalog: DeveloperExperiencePlatformCatalogPort,
  ) {}

  execute(): Promise<DeveloperExperiencePlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListDeveloperExperiencePlatformProductsQuery)
export class ListDeveloperExperiencePlatformProductsHandler
  implements IQueryHandler<ListDeveloperExperiencePlatformProductsQuery>
{
  constructor(
    @Inject(DEVELOPER_EXPERIENCE_PLATFORM_CATALOG_PORT)
    private readonly catalog: DeveloperExperiencePlatformCatalogPort,
  ) {}

  execute(): Promise<DeveloperExperiencePlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const DEVELOPER_EXPERIENCE_PLATFORM_HANDLERS = [GetDeveloperExperiencePlatformEngineHandler, ListDeveloperExperiencePlatformProductsHandler];
