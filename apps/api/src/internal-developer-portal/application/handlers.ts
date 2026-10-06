import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetInternalDeveloperPortalEngineQuery, ListInternalDeveloperPortalProductsQuery } from './messages';
import {
  INTERNAL_DEVELOPER_PORTAL_CATALOG_PORT,
  InternalDeveloperPortalCatalogPort,
  InternalDeveloperPortalEngineBundle,
  InternalDeveloperPortalProductRow,
} from './ports';

@QueryHandler(GetInternalDeveloperPortalEngineQuery)
export class GetInternalDeveloperPortalEngineHandler
  implements IQueryHandler<GetInternalDeveloperPortalEngineQuery>
{
  constructor(
    @Inject(INTERNAL_DEVELOPER_PORTAL_CATALOG_PORT)
    private readonly catalog: InternalDeveloperPortalCatalogPort,
  ) {}

  execute: Promise<InternalDeveloperPortalEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListInternalDeveloperPortalProductsQuery)
export class ListInternalDeveloperPortalProductsHandler
  implements IQueryHandler<ListInternalDeveloperPortalProductsQuery>
{
  constructor(
    @Inject(INTERNAL_DEVELOPER_PORTAL_CATALOG_PORT)
    private readonly catalog: InternalDeveloperPortalCatalogPort,
  ) {}

  execute: Promise<InternalDeveloperPortalProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const INTERNAL_DEVELOPER_PORTAL_HANDLERS = [GetInternalDeveloperPortalEngineHandler, ListInternalDeveloperPortalProductsHandler];
