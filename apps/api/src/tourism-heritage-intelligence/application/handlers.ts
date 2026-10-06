import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTourismHeritageIntelligenceEngineQuery, ListTourismHeritageIntelligenceProductsQuery } from './messages';
import {
  TOURISM_HERITAGE_INTELLIGENCE_CATALOG_PORT,
  TourismHeritageIntelligenceCatalogPort,
  TourismHeritageIntelligenceEngineBundle,
  TourismHeritageIntelligenceProductRow,
} from './ports';

@QueryHandler(GetTourismHeritageIntelligenceEngineQuery)
export class GetTourismHeritageIntelligenceEngineHandler
  implements IQueryHandler<GetTourismHeritageIntelligenceEngineQuery>
{
  constructor(
    @Inject(TOURISM_HERITAGE_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: TourismHeritageIntelligenceCatalogPort,
  ) {}

  execute(): Promise<TourismHeritageIntelligenceEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListTourismHeritageIntelligenceProductsQuery)
export class ListTourismHeritageIntelligenceProductsHandler
  implements IQueryHandler<ListTourismHeritageIntelligenceProductsQuery>
{
  constructor(
    @Inject(TOURISM_HERITAGE_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: TourismHeritageIntelligenceCatalogPort,
  ) {}

  execute(): Promise<TourismHeritageIntelligenceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const TOURISM_HERITAGE_INTELLIGENCE_HANDLERS = [GetTourismHeritageIntelligenceEngineHandler, ListTourismHeritageIntelligenceProductsHandler];
