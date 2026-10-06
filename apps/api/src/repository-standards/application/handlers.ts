import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetRepositoryStandardsEngineQuery, ListRepositoryStandardsProductsQuery } from './messages';
import {
  REPOSITORY_STANDARDS_CATALOG_PORT,
  RepositoryStandardsCatalogPort,
  RepositoryStandardsEngineBundle,
  RepositoryStandardsProductRow,
} from './ports';

@QueryHandler(GetRepositoryStandardsEngineQuery)
export class GetRepositoryStandardsEngineHandler
  implements IQueryHandler<GetRepositoryStandardsEngineQuery>
{
  constructor(
    @Inject(REPOSITORY_STANDARDS_CATALOG_PORT)
    private readonly catalog: RepositoryStandardsCatalogPort,
  ) {}

  execute(): Promise<RepositoryStandardsEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListRepositoryStandardsProductsQuery)
export class ListRepositoryStandardsProductsHandler
  implements IQueryHandler<ListRepositoryStandardsProductsQuery>
{
  constructor(
    @Inject(REPOSITORY_STANDARDS_CATALOG_PORT)
    private readonly catalog: RepositoryStandardsCatalogPort,
  ) {}

  execute(): Promise<RepositoryStandardsProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const REPOSITORY_STANDARDS_HANDLERS = [GetRepositoryStandardsEngineHandler, ListRepositoryStandardsProductsHandler];
