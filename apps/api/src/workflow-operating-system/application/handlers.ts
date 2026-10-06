import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetWorkflowOperatingSystemEngineQuery, ListWorkflowOperatingSystemProductsQuery } from './messages';
import {
  WORKFLOW_OPERATING_SYSTEM_CATALOG_PORT,
  WorkflowOperatingSystemCatalogPort,
  WorkflowOperatingSystemEngineBundle,
  WorkflowOperatingSystemProductRow,
} from './ports';

@QueryHandler(GetWorkflowOperatingSystemEngineQuery)
export class GetWorkflowOperatingSystemEngineHandler
  implements IQueryHandler<GetWorkflowOperatingSystemEngineQuery>
{
  constructor(
    @Inject(WORKFLOW_OPERATING_SYSTEM_CATALOG_PORT)
    private readonly catalog: WorkflowOperatingSystemCatalogPort,
  ) {}

  execute: Promise<WorkflowOperatingSystemEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListWorkflowOperatingSystemProductsQuery)
export class ListWorkflowOperatingSystemProductsHandler
  implements IQueryHandler<ListWorkflowOperatingSystemProductsQuery>
{
  constructor(
    @Inject(WORKFLOW_OPERATING_SYSTEM_CATALOG_PORT)
    private readonly catalog: WorkflowOperatingSystemCatalogPort,
  ) {}

  execute: Promise<WorkflowOperatingSystemProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const WORKFLOW_OPERATING_SYSTEM_HANDLERS = [GetWorkflowOperatingSystemEngineHandler, ListWorkflowOperatingSystemProductsHandler];
