import { Injectable } from '@nestjs/common';
import { AgentMarketplaceService } from '../agent-marketplace.service';
import {
  AgentMarketplaceCatalogPort,
  AgentMarketplaceEngineBundle,
} from './ports';

@Injectable
export class NestAgentMarketplaceCatalogAdapter implements AgentMarketplaceCatalogPort {
  constructor(private readonly marketplace: AgentMarketplaceService) {}

  engine: AgentMarketplaceEngineBundle {
    return this.marketplace.engine;
  }
}
