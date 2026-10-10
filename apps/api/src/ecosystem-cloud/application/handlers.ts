import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetEcosystemProductsBundleQuery,
  ListEcosystemProductsQuery,
} from './messages';
import {
  ECOSYSTEM_CATALOG_PORT,
  EcosystemCatalogPort,
  EcosystemProductRow,
  EcosystemProductsBundle,
} from './ports';

@QueryHandler(ListEcosystemProductsQuery)
export class ListEcosystemProductsHandler
  implements IQueryHandler<ListEcosystemProductsQuery>
{
  constructor(
    @Inject(ECOSYSTEM_CATALOG_PORT) private readonly catalog: EcosystemCatalogPort,
  ) {}

  execute(): Promise<EcosystemProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

@QueryHandler(GetEcosystemProductsBundleQuery)
export class GetEcosystemProductsBundleHandler
  implements IQueryHandler<GetEcosystemProductsBundleQuery>
{
  constructor(
    @Inject(ECOSYSTEM_CATALOG_PORT) private readonly catalog: EcosystemCatalogPort,
  ) {}

  execute(): Promise<EcosystemProductsBundle> {
    return Promise.resolve(this.catalog.products());
  }
}

export const ECOSYSTEM_HANDLERS = [
  ListEcosystemProductsHandler,
  GetEcosystemProductsBundleHandler,
];
