import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetSupplyChainSecurityEngineQuery, ListSupplyChainSecurityProductsQuery } from './messages';
import {
  SUPPLY_CHAIN_SECURITY_CATALOG_PORT,
  SupplyChainSecurityCatalogPort,
  SupplyChainSecurityEngineBundle,
  SupplyChainSecurityProductRow,
} from './ports';

@QueryHandler(GetSupplyChainSecurityEngineQuery)
export class GetSupplyChainSecurityEngineHandler
  implements IQueryHandler<GetSupplyChainSecurityEngineQuery>
{
  constructor(
    @Inject(SUPPLY_CHAIN_SECURITY_CATALOG_PORT)
    private readonly catalog: SupplyChainSecurityCatalogPort,
  ) {}

  execute: Promise<SupplyChainSecurityEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListSupplyChainSecurityProductsQuery)
export class ListSupplyChainSecurityProductsHandler
  implements IQueryHandler<ListSupplyChainSecurityProductsQuery>
{
  constructor(
    @Inject(SUPPLY_CHAIN_SECURITY_CATALOG_PORT)
    private readonly catalog: SupplyChainSecurityCatalogPort,
  ) {}

  execute: Promise<SupplyChainSecurityProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const SUPPLY_CHAIN_SECURITY_HANDLERS = [GetSupplyChainSecurityEngineHandler, ListSupplyChainSecurityProductsHandler];
