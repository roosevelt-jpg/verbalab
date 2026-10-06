import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetWorkflowMarketplaceEngineQuery } from './messages';
import {
  WORKFLOW_MARKETPLACE_CATALOG_PORT,
  WorkflowMarketplaceCatalogPort,
  WorkflowMarketplaceEngineBundle,
} from './ports';

@QueryHandler(GetWorkflowMarketplaceEngineQuery)
export class GetWorkflowMarketplaceEngineHandler
  implements IQueryHandler<GetWorkflowMarketplaceEngineQuery>
{
  constructor(
    @Inject(WORKFLOW_MARKETPLACE_CATALOG_PORT)
    private readonly catalog: WorkflowMarketplaceCatalogPort,
  ) {}

  execute(): Promise<WorkflowMarketplaceEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

export const WORKFLOW_MARKETPLACE_HANDLERS = [GetWorkflowMarketplaceEngineHandler];
