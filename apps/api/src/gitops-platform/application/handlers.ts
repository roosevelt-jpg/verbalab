import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetGitopsPlatformEngineQuery, ListGitopsPlatformProductsQuery } from './messages';
import {
  GITOPS_PLATFORM_CATALOG_PORT,
  GitopsPlatformCatalogPort,
  GitopsPlatformEngineBundle,
  GitopsPlatformProductRow,
} from './ports';

@QueryHandler(GetGitopsPlatformEngineQuery)
export class GetGitopsPlatformEngineHandler
  implements IQueryHandler<GetGitopsPlatformEngineQuery>
{
  constructor(
    @Inject(GITOPS_PLATFORM_CATALOG_PORT)
    private readonly catalog: GitopsPlatformCatalogPort,
  ) {}

  execute: Promise<GitopsPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListGitopsPlatformProductsQuery)
export class ListGitopsPlatformProductsHandler
  implements IQueryHandler<ListGitopsPlatformProductsQuery>
{
  constructor(
    @Inject(GITOPS_PLATFORM_CATALOG_PORT)
    private readonly catalog: GitopsPlatformCatalogPort,
  ) {}

  execute: Promise<GitopsPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const GITOPS_PLATFORM_HANDLERS = [GetGitopsPlatformEngineHandler, ListGitopsPlatformProductsHandler];
