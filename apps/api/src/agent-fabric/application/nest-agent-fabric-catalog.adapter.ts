import { Injectable } from '@nestjs/common';
import { AgentFabricService } from '../agent-fabric.service';
import {
  agentFabricCapabilityCatalog,
  agentFabricRoutingTable,
} from '../agent-fabric.catalog';
import {
  AgentFabricCapabilityRow,
  AgentFabricCatalogPort,
  AgentFabricProductsBundle,
  AgentFabricRouteRow,
} from './ports';

@Injectable
export class NestAgentFabricCatalogAdapter implements AgentFabricCatalogPort {
  constructor(private readonly fabric: AgentFabricService) {}

  products: AgentFabricProductsBundle {
    return this.fabric.products;
  }

  listCapabilities: AgentFabricCapabilityRow[] {
    return agentFabricCapabilityCatalog;
  }

  listRoutes: AgentFabricRouteRow[] {
    return agentFabricRoutingTable;
  }
}
