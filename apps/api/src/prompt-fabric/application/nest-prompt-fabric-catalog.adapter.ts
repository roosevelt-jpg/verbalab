import { Injectable } from '@nestjs/common';
import { PromptFabricService } from '../prompt-fabric.service';
import {
  promptFabricCapabilityCatalog,
  promptFabricRoutingTable,
} from '../prompt-fabric.catalog';
import {
  PromptFabricCapabilityRow,
  PromptFabricCatalogPort,
  PromptFabricProductsBundle,
  PromptFabricRouteRow,
} from './ports';

@Injectable
export class NestPromptFabricCatalogAdapter implements PromptFabricCatalogPort {
  constructor(private readonly fabric: PromptFabricService) {}

  products: PromptFabricProductsBundle {
    return this.fabric.products;
  }

  listCapabilities: PromptFabricCapabilityRow[] {
    return promptFabricCapabilityCatalog;
  }

  listRoutes: PromptFabricRouteRow[] {
    return promptFabricRoutingTable;
  }
}
