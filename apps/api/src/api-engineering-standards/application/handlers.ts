import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetApiEngineeringStandardsEngineQuery, ListApiEngineeringStandardsProductsQuery } from './messages';
import {
  API_ENGINEERING_STANDARDS_CATALOG_PORT,
  ApiEngineeringStandardsCatalogPort,
  ApiEngineeringStandardsEngineBundle,
  ApiEngineeringStandardsProductRow,
} from './ports';

@QueryHandler(GetApiEngineeringStandardsEngineQuery)
export class GetApiEngineeringStandardsEngineHandler
  implements IQueryHandler<GetApiEngineeringStandardsEngineQuery>
{
  constructor(
    @Inject(API_ENGINEERING_STANDARDS_CATALOG_PORT)
    private readonly catalog: ApiEngineeringStandardsCatalogPort,
  ) {}

  execute(): Promise<ApiEngineeringStandardsEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListApiEngineeringStandardsProductsQuery)
export class ListApiEngineeringStandardsProductsHandler
  implements IQueryHandler<ListApiEngineeringStandardsProductsQuery>
{
  constructor(
    @Inject(API_ENGINEERING_STANDARDS_CATALOG_PORT)
    private readonly catalog: ApiEngineeringStandardsCatalogPort,
  ) {}

  execute(): Promise<ApiEngineeringStandardsProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const API_ENGINEERING_STANDARDS_HANDLERS = [GetApiEngineeringStandardsEngineHandler, ListApiEngineeringStandardsProductsHandler];
