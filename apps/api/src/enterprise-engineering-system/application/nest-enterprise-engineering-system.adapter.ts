import { Injectable } from '@nestjs/common';
import { EnterpriseEngineeringSystemService } from '../enterprise-engineering-system.service';
import {
  EnterpriseEngineeringSystemCatalogPort,
  EnterpriseEngineeringSystemEngineBundle,
  EnterpriseEngineeringSystemProductRow,
} from './ports';

@Injectable
export class NestEnterpriseEngineeringSystemCatalogAdapter implements EnterpriseEngineeringSystemCatalogPort {
  constructor(private readonly service: EnterpriseEngineeringSystemService) {}

  engine: EnterpriseEngineeringSystemEngineBundle {
    return this.service.products;
  }

  listProducts: EnterpriseEngineeringSystemProductRow[] {
    return this.service.products.products;
  }
}
