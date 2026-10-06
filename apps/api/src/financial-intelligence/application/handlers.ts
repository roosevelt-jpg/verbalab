import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetFinancialIntelligenceEngineQuery, ListFinancialIntelligenceProductsQuery } from './messages';
import {
  FINANCIAL_INTELLIGENCE_CATALOG_PORT,
  FinancialIntelligenceCatalogPort,
  FinancialIntelligenceEngineBundle,
  FinancialIntelligenceProductRow,
} from './ports';

@QueryHandler(GetFinancialIntelligenceEngineQuery)
export class GetFinancialIntelligenceEngineHandler
  implements IQueryHandler<GetFinancialIntelligenceEngineQuery>
{
  constructor(
    @Inject(FINANCIAL_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: FinancialIntelligenceCatalogPort,
  ) {}

  execute: Promise<FinancialIntelligenceEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListFinancialIntelligenceProductsQuery)
export class ListFinancialIntelligenceProductsHandler
  implements IQueryHandler<ListFinancialIntelligenceProductsQuery>
{
  constructor(
    @Inject(FINANCIAL_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: FinancialIntelligenceCatalogPort,
  ) {}

  execute: Promise<FinancialIntelligenceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const FINANCIAL_INTELLIGENCE_HANDLERS = [GetFinancialIntelligenceEngineHandler, ListFinancialIntelligenceProductsHandler];
