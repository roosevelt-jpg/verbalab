import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetIntelligenceProductsBundleQuery,
  ListIntelligenceProductsQuery,
} from './messages';
import {
  INTELLIGENCE_CATALOG_PORT,
  IntelligenceCatalogPort,
  IntelligenceProductRow,
  IntelligenceProductsBundle,
} from './ports';

@QueryHandler(ListIntelligenceProductsQuery)
export class ListIntelligenceProductsHandler
  implements IQueryHandler<ListIntelligenceProductsQuery>
{
  constructor(
    @Inject(INTELLIGENCE_CATALOG_PORT) private readonly catalog: IntelligenceCatalogPort,
  ) {}

  execute: Promise<IntelligenceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

@QueryHandler(GetIntelligenceProductsBundleQuery)
export class GetIntelligenceProductsBundleHandler
  implements IQueryHandler<GetIntelligenceProductsBundleQuery>
{
  constructor(
    @Inject(INTELLIGENCE_CATALOG_PORT) private readonly catalog: IntelligenceCatalogPort,
  ) {}

  execute: Promise<IntelligenceProductsBundle> {
    return Promise.resolve(this.catalog.products);
  }
}

export const INTELLIGENCE_CLOUD_HANDLERS = [
  ListIntelligenceProductsHandler,
  GetIntelligenceProductsBundleHandler,
];
