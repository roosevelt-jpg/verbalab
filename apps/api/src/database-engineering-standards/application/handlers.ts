import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDatabaseEngineeringStandardsEngineQuery, ListDatabaseEngineeringStandardsProductsQuery } from './messages';
import {
  DATABASE_ENGINEERING_STANDARDS_CATALOG_PORT,
  DatabaseEngineeringStandardsCatalogPort,
  DatabaseEngineeringStandardsEngineBundle,
  DatabaseEngineeringStandardsProductRow,
} from './ports';

@QueryHandler(GetDatabaseEngineeringStandardsEngineQuery)
export class GetDatabaseEngineeringStandardsEngineHandler
  implements IQueryHandler<GetDatabaseEngineeringStandardsEngineQuery>
{
  constructor(
    @Inject(DATABASE_ENGINEERING_STANDARDS_CATALOG_PORT)
    private readonly catalog: DatabaseEngineeringStandardsCatalogPort,
  ) {}

  execute(): Promise<DatabaseEngineeringStandardsEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListDatabaseEngineeringStandardsProductsQuery)
export class ListDatabaseEngineeringStandardsProductsHandler
  implements IQueryHandler<ListDatabaseEngineeringStandardsProductsQuery>
{
  constructor(
    @Inject(DATABASE_ENGINEERING_STANDARDS_CATALOG_PORT)
    private readonly catalog: DatabaseEngineeringStandardsCatalogPort,
  ) {}

  execute(): Promise<DatabaseEngineeringStandardsProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const DATABASE_ENGINEERING_STANDARDS_HANDLERS = [GetDatabaseEngineeringStandardsEngineHandler, ListDatabaseEngineeringStandardsProductsHandler];
