import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetVaiosEngineQuery, ListVaiosProductsQuery } from './messages';
import {
  VAIOS_CATALOG_PORT,
  VaiosCatalogPort,
  VaiosEngineBundle,
  VaiosProductRow,
} from './ports';

@QueryHandler(GetVaiosEngineQuery)
export class GetVaiosEngineHandler
  implements IQueryHandler<GetVaiosEngineQuery>
{
  constructor(
    @Inject(VAIOS_CATALOG_PORT)
    private readonly catalog: VaiosCatalogPort,
  ) {}

  execute: Promise<VaiosEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListVaiosProductsQuery)
export class ListVaiosProductsHandler
  implements IQueryHandler<ListVaiosProductsQuery>
{
  constructor(
    @Inject(VAIOS_CATALOG_PORT)
    private readonly catalog: VaiosCatalogPort,
  ) {}

  execute: Promise<VaiosProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const VAIOS_HANDLERS = [GetVaiosEngineHandler, ListVaiosProductsHandler];
