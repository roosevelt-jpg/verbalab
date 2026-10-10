import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetServiceCatalogEngineQuery, ListServiceCatalogProductsQuery } from './messages';
import {
  SERVICE_CATALOG_CATALOG_PORT,
  ServiceCatalogCatalogPort,
  ServiceCatalogEngineBundle,
  ServiceCatalogProductRow,
} from './ports';

@QueryHandler(GetServiceCatalogEngineQuery)
export class GetServiceCatalogEngineHandler
  implements IQueryHandler<GetServiceCatalogEngineQuery>
{
  constructor(
    @Inject(SERVICE_CATALOG_CATALOG_PORT)
    private readonly catalog: ServiceCatalogCatalogPort,
  ) {}

  execute(): Promise<ServiceCatalogEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListServiceCatalogProductsQuery)
export class ListServiceCatalogProductsHandler
  implements IQueryHandler<ListServiceCatalogProductsQuery>
{
  constructor(
    @Inject(SERVICE_CATALOG_CATALOG_PORT)
    private readonly catalog: ServiceCatalogCatalogPort,
  ) {}

  execute(): Promise<ServiceCatalogProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const SERVICE_CATALOG_HANDLERS = [GetServiceCatalogEngineHandler, ListServiceCatalogProductsHandler];
