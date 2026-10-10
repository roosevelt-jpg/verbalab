import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetArchitectureGovernanceEngineQuery, ListArchitectureGovernanceProductsQuery } from './messages';
import {
  ARCHITECTURE_GOVERNANCE_CATALOG_PORT,
  ArchitectureGovernanceCatalogPort,
  ArchitectureGovernanceEngineBundle,
  ArchitectureGovernanceProductRow,
} from './ports';

@QueryHandler(GetArchitectureGovernanceEngineQuery)
export class GetArchitectureGovernanceEngineHandler
  implements IQueryHandler<GetArchitectureGovernanceEngineQuery>
{
  constructor(
    @Inject(ARCHITECTURE_GOVERNANCE_CATALOG_PORT)
    private readonly catalog: ArchitectureGovernanceCatalogPort,
  ) {}

  execute(): Promise<ArchitectureGovernanceEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListArchitectureGovernanceProductsQuery)
export class ListArchitectureGovernanceProductsHandler
  implements IQueryHandler<ListArchitectureGovernanceProductsQuery>
{
  constructor(
    @Inject(ARCHITECTURE_GOVERNANCE_CATALOG_PORT)
    private readonly catalog: ArchitectureGovernanceCatalogPort,
  ) {}

  execute(): Promise<ArchitectureGovernanceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const ARCHITECTURE_GOVERNANCE_HANDLERS = [GetArchitectureGovernanceEngineHandler, ListArchitectureGovernanceProductsHandler];
