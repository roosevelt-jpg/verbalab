import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetInfrastructureEngineeringStandardsEngineQuery, ListInfrastructureEngineeringStandardsProductsQuery } from './messages';
import {
  INFRASTRUCTURE_ENGINEERING_STANDARDS_CATALOG_PORT,
  InfrastructureEngineeringStandardsCatalogPort,
  InfrastructureEngineeringStandardsEngineBundle,
  InfrastructureEngineeringStandardsProductRow,
} from './ports';

@QueryHandler(GetInfrastructureEngineeringStandardsEngineQuery)
export class GetInfrastructureEngineeringStandardsEngineHandler
  implements IQueryHandler<GetInfrastructureEngineeringStandardsEngineQuery>
{
  constructor(
    @Inject(INFRASTRUCTURE_ENGINEERING_STANDARDS_CATALOG_PORT)
    private readonly catalog: InfrastructureEngineeringStandardsCatalogPort,
  ) {}

  execute(): Promise<InfrastructureEngineeringStandardsEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListInfrastructureEngineeringStandardsProductsQuery)
export class ListInfrastructureEngineeringStandardsProductsHandler
  implements IQueryHandler<ListInfrastructureEngineeringStandardsProductsQuery>
{
  constructor(
    @Inject(INFRASTRUCTURE_ENGINEERING_STANDARDS_CATALOG_PORT)
    private readonly catalog: InfrastructureEngineeringStandardsCatalogPort,
  ) {}

  execute(): Promise<InfrastructureEngineeringStandardsProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const INFRASTRUCTURE_ENGINEERING_STANDARDS_HANDLERS = [GetInfrastructureEngineeringStandardsEngineHandler, ListInfrastructureEngineeringStandardsProductsHandler];
