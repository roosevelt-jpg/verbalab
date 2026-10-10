import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetRiskIntelligenceEngineQuery, ListRiskIntelligenceProductsQuery } from './messages';
import {
  RISK_INTELLIGENCE_CATALOG_PORT,
  RiskIntelligenceCatalogPort,
  RiskIntelligenceEngineBundle,
  RiskIntelligenceProductRow,
} from './ports';

@QueryHandler(GetRiskIntelligenceEngineQuery)
export class GetRiskIntelligenceEngineHandler
  implements IQueryHandler<GetRiskIntelligenceEngineQuery>
{
  constructor(
    @Inject(RISK_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: RiskIntelligenceCatalogPort,
  ) {}

  execute(): Promise<RiskIntelligenceEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListRiskIntelligenceProductsQuery)
export class ListRiskIntelligenceProductsHandler
  implements IQueryHandler<ListRiskIntelligenceProductsQuery>
{
  constructor(
    @Inject(RISK_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: RiskIntelligenceCatalogPort,
  ) {}

  execute(): Promise<RiskIntelligenceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const RISK_INTELLIGENCE_HANDLERS = [GetRiskIntelligenceEngineHandler, ListRiskIntelligenceProductsHandler];
