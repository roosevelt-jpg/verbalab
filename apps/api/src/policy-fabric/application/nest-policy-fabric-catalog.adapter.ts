import { Injectable } from '@nestjs/common';
import { PolicyFabricService } from '../policy-fabric.service';
import {
  policyFabricCapabilityCatalog,
  policyFabricRoutingTable,
} from '../policy-fabric.catalog';
import {
  PolicyFabricCapabilityRow,
  PolicyFabricCatalogPort,
  PolicyFabricProductsBundle,
  PolicyFabricRouteRow,
} from './ports';

@Injectable()
export class NestPolicyFabricCatalogAdapter implements PolicyFabricCatalogPort {
  constructor(private readonly fabric: PolicyFabricService) {}

  products(): PolicyFabricProductsBundle {
    return this.fabric.products();
  }

  listCapabilities(): PolicyFabricCapabilityRow[] {
    return policyFabricCapabilityCatalog();
  }

  listRoutes(): PolicyFabricRouteRow[] {
    return policyFabricRoutingTable();
  }
}
