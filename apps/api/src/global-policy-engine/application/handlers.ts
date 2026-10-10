import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetGlobalPolicyEngineEngineQuery, ListGlobalPolicyEngineProductsQuery } from './messages';
import {
  GLOBAL_POLICY_ENGINE_CATALOG_PORT,
  GlobalPolicyEngineCatalogPort,
  GlobalPolicyEngineEngineBundle,
  GlobalPolicyEngineProductRow,
} from './ports';

@QueryHandler(GetGlobalPolicyEngineEngineQuery)
export class GetGlobalPolicyEngineEngineHandler
  implements IQueryHandler<GetGlobalPolicyEngineEngineQuery>
{
  constructor(
    @Inject(GLOBAL_POLICY_ENGINE_CATALOG_PORT)
    private readonly catalog: GlobalPolicyEngineCatalogPort,
  ) {}

  execute(): Promise<GlobalPolicyEngineEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListGlobalPolicyEngineProductsQuery)
export class ListGlobalPolicyEngineProductsHandler
  implements IQueryHandler<ListGlobalPolicyEngineProductsQuery>
{
  constructor(
    @Inject(GLOBAL_POLICY_ENGINE_CATALOG_PORT)
    private readonly catalog: GlobalPolicyEngineCatalogPort,
  ) {}

  execute(): Promise<GlobalPolicyEngineProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const GLOBAL_POLICY_ENGINE_HANDLERS = [GetGlobalPolicyEngineEngineHandler, ListGlobalPolicyEngineProductsHandler];
