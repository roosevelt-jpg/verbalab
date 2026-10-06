import { Injectable } from '@nestjs/common';
import { WorkflowMarketplaceService } from '../workflow-marketplace.service';
import {
  WorkflowMarketplaceCatalogPort,
  WorkflowMarketplaceEngineBundle,
} from './ports';

@Injectable
export class NestWorkflowMarketplaceCatalogAdapter implements WorkflowMarketplaceCatalogPort {
  constructor(private readonly marketplace: WorkflowMarketplaceService) {}

  engine: WorkflowMarketplaceEngineBundle {
    return this.marketplace.engine;
  }
}
