import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetRuntimeManagerEngineQuery, ListRuntimeManagerProductsQuery } from './messages';
import {
  RUNTIME_MANAGER_CATALOG_PORT,
  RuntimeManagerCatalogPort,
  RuntimeManagerEngineBundle,
  RuntimeManagerProductRow,
} from './ports';

@QueryHandler(GetRuntimeManagerEngineQuery)
export class GetRuntimeManagerEngineHandler
  implements IQueryHandler<GetRuntimeManagerEngineQuery>
{
  constructor(
    @Inject(RUNTIME_MANAGER_CATALOG_PORT)
    private readonly catalog: RuntimeManagerCatalogPort,
  ) {}

  execute: Promise<RuntimeManagerEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListRuntimeManagerProductsQuery)
export class ListRuntimeManagerProductsHandler
  implements IQueryHandler<ListRuntimeManagerProductsQuery>
{
  constructor(
    @Inject(RUNTIME_MANAGER_CATALOG_PORT)
    private readonly catalog: RuntimeManagerCatalogPort,
  ) {}

  execute: Promise<RuntimeManagerProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const RUNTIME_MANAGER_HANDLERS = [GetRuntimeManagerEngineHandler, ListRuntimeManagerProductsHandler];
