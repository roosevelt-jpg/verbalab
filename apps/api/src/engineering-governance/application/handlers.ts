import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEngineeringGovernanceEngineQuery, ListEngineeringGovernanceProductsQuery } from './messages';
import {
  ENGINEERING_GOVERNANCE_CATALOG_PORT,
  EngineeringGovernanceCatalogPort,
  EngineeringGovernanceEngineBundle,
  EngineeringGovernanceProductRow,
} from './ports';

@QueryHandler(GetEngineeringGovernanceEngineQuery)
export class GetEngineeringGovernanceEngineHandler
  implements IQueryHandler<GetEngineeringGovernanceEngineQuery>
{
  constructor(
    @Inject(ENGINEERING_GOVERNANCE_CATALOG_PORT)
    private readonly catalog: EngineeringGovernanceCatalogPort,
  ) {}

  execute(): Promise<EngineeringGovernanceEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListEngineeringGovernanceProductsQuery)
export class ListEngineeringGovernanceProductsHandler
  implements IQueryHandler<ListEngineeringGovernanceProductsQuery>
{
  constructor(
    @Inject(ENGINEERING_GOVERNANCE_CATALOG_PORT)
    private readonly catalog: EngineeringGovernanceCatalogPort,
  ) {}

  execute(): Promise<EngineeringGovernanceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const ENGINEERING_GOVERNANCE_HANDLERS = [GetEngineeringGovernanceEngineHandler, ListEngineeringGovernanceProductsHandler];
