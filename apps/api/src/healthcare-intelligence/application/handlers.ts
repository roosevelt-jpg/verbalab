import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetHealthcareIntelligenceEngineQuery, ListHealthcareIntelligenceProductsQuery } from './messages';
import {
  HEALTHCARE_INTELLIGENCE_CATALOG_PORT,
  HealthcareIntelligenceCatalogPort,
  HealthcareIntelligenceEngineBundle,
  HealthcareIntelligenceProductRow,
} from './ports';

@QueryHandler(GetHealthcareIntelligenceEngineQuery)
export class GetHealthcareIntelligenceEngineHandler
  implements IQueryHandler<GetHealthcareIntelligenceEngineQuery>
{
  constructor(
    @Inject(HEALTHCARE_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: HealthcareIntelligenceCatalogPort,
  ) {}

  execute(): Promise<HealthcareIntelligenceEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListHealthcareIntelligenceProductsQuery)
export class ListHealthcareIntelligenceProductsHandler
  implements IQueryHandler<ListHealthcareIntelligenceProductsQuery>
{
  constructor(
    @Inject(HEALTHCARE_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: HealthcareIntelligenceCatalogPort,
  ) {}

  execute(): Promise<HealthcareIntelligenceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const HEALTHCARE_INTELLIGENCE_HANDLERS = [GetHealthcareIntelligenceEngineHandler, ListHealthcareIntelligenceProductsHandler];
