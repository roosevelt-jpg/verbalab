import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCulturalIntelligenceEngineQuery, ListCulturalIntelligenceProductsQuery } from './messages';
import {
  CULTURAL_INTELLIGENCE_CATALOG_PORT,
  CulturalIntelligenceCatalogPort,
  CulturalIntelligenceEngineBundle,
  CulturalIntelligenceProductRow,
} from './ports';

@QueryHandler(GetCulturalIntelligenceEngineQuery)
export class GetCulturalIntelligenceEngineHandler
  implements IQueryHandler<GetCulturalIntelligenceEngineQuery>
{
  constructor(
    @Inject(CULTURAL_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: CulturalIntelligenceCatalogPort,
  ) {}

  execute(): Promise<CulturalIntelligenceEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListCulturalIntelligenceProductsQuery)
export class ListCulturalIntelligenceProductsHandler
  implements IQueryHandler<ListCulturalIntelligenceProductsQuery>
{
  constructor(
    @Inject(CULTURAL_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: CulturalIntelligenceCatalogPort,
  ) {}

  execute(): Promise<CulturalIntelligenceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const CULTURAL_INTELLIGENCE_HANDLERS = [GetCulturalIntelligenceEngineHandler, ListCulturalIntelligenceProductsHandler];
