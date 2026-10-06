import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEnterpriseEngineeringSystemEngineQuery, ListEnterpriseEngineeringSystemProductsQuery } from './messages';
import {
  ENTERPRISE_ENGINEERING_SYSTEM_CATALOG_PORT,
  EnterpriseEngineeringSystemCatalogPort,
  EnterpriseEngineeringSystemEngineBundle,
  EnterpriseEngineeringSystemProductRow,
} from './ports';

@QueryHandler(GetEnterpriseEngineeringSystemEngineQuery)
export class GetEnterpriseEngineeringSystemEngineHandler
  implements IQueryHandler<GetEnterpriseEngineeringSystemEngineQuery>
{
  constructor(
    @Inject(ENTERPRISE_ENGINEERING_SYSTEM_CATALOG_PORT)
    private readonly catalog: EnterpriseEngineeringSystemCatalogPort,
  ) {}

  execute: Promise<EnterpriseEngineeringSystemEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListEnterpriseEngineeringSystemProductsQuery)
export class ListEnterpriseEngineeringSystemProductsHandler
  implements IQueryHandler<ListEnterpriseEngineeringSystemProductsQuery>
{
  constructor(
    @Inject(ENTERPRISE_ENGINEERING_SYSTEM_CATALOG_PORT)
    private readonly catalog: EnterpriseEngineeringSystemCatalogPort,
  ) {}

  execute: Promise<EnterpriseEngineeringSystemProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const ENTERPRISE_ENGINEERING_SYSTEM_HANDLERS = [GetEnterpriseEngineeringSystemEngineHandler, ListEnterpriseEngineeringSystemProductsHandler];
