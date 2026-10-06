import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrganizationControlEngineQuery, ListOrganizationControlProductsQuery } from './messages';
import {
  ORGANIZATION_CONTROL_CATALOG_PORT,
  OrganizationControlCatalogPort,
  OrganizationControlEngineBundle,
  OrganizationControlProductRow,
} from './ports';

@QueryHandler(GetOrganizationControlEngineQuery)
export class GetOrganizationControlEngineHandler
  implements IQueryHandler<GetOrganizationControlEngineQuery>
{
  constructor(
    @Inject(ORGANIZATION_CONTROL_CATALOG_PORT)
    private readonly catalog: OrganizationControlCatalogPort,
  ) {}

  execute: Promise<OrganizationControlEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListOrganizationControlProductsQuery)
export class ListOrganizationControlProductsHandler
  implements IQueryHandler<ListOrganizationControlProductsQuery>
{
  constructor(
    @Inject(ORGANIZATION_CONTROL_CATALOG_PORT)
    private readonly catalog: OrganizationControlCatalogPort,
  ) {}

  execute: Promise<OrganizationControlProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const ORGANIZATION_CONTROL_HANDLERS = [GetOrganizationControlEngineHandler, ListOrganizationControlProductsHandler];
