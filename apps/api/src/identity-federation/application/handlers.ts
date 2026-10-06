import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetIdentityFederationEngineQuery, ListIdentityFederationProductsQuery } from './messages';
import {
  IDENTITY_FEDERATION_CATALOG_PORT,
  IdentityFederationCatalogPort,
  IdentityFederationEngineBundle,
  IdentityFederationProductRow,
} from './ports';

@QueryHandler(GetIdentityFederationEngineQuery)
export class GetIdentityFederationEngineHandler
  implements IQueryHandler<GetIdentityFederationEngineQuery>
{
  constructor(
    @Inject(IDENTITY_FEDERATION_CATALOG_PORT)
    private readonly catalog: IdentityFederationCatalogPort,
  ) {}

  execute: Promise<IdentityFederationEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListIdentityFederationProductsQuery)
export class ListIdentityFederationProductsHandler
  implements IQueryHandler<ListIdentityFederationProductsQuery>
{
  constructor(
    @Inject(IDENTITY_FEDERATION_CATALOG_PORT)
    private readonly catalog: IdentityFederationCatalogPort,
  ) {}

  execute: Promise<IdentityFederationProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const IDENTITY_FEDERATION_HANDLERS = [GetIdentityFederationEngineHandler, ListIdentityFederationProductsHandler];
