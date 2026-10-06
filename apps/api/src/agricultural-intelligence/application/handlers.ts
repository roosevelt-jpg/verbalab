import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAgriculturalIntelligenceEngineQuery, ListAgriculturalIntelligenceProductsQuery } from './messages';
import {
  AGRICULTURAL_INTELLIGENCE_CATALOG_PORT,
  AgriculturalIntelligenceCatalogPort,
  AgriculturalIntelligenceEngineBundle,
  AgriculturalIntelligenceProductRow,
} from './ports';

@QueryHandler(GetAgriculturalIntelligenceEngineQuery)
export class GetAgriculturalIntelligenceEngineHandler
  implements IQueryHandler<GetAgriculturalIntelligenceEngineQuery>
{
  constructor(
    @Inject(AGRICULTURAL_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: AgriculturalIntelligenceCatalogPort,
  ) {}

  execute: Promise<AgriculturalIntelligenceEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListAgriculturalIntelligenceProductsQuery)
export class ListAgriculturalIntelligenceProductsHandler
  implements IQueryHandler<ListAgriculturalIntelligenceProductsQuery>
{
  constructor(
    @Inject(AGRICULTURAL_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: AgriculturalIntelligenceCatalogPort,
  ) {}

  execute: Promise<AgriculturalIntelligenceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const AGRICULTURAL_INTELLIGENCE_HANDLERS = [GetAgriculturalIntelligenceEngineHandler, ListAgriculturalIntelligenceProductsHandler];
