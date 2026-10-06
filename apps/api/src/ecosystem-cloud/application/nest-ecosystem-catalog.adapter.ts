import { Injectable } from '@nestjs/common';
import { EcosystemCloudService } from '../ecosystem-cloud.service';
import { ecosystemProductCatalog } from '../ecosystem-cloud.catalog';
import {
  EcosystemCatalogPort,
  EcosystemProductRow,
  EcosystemProductsBundle,
} from './ports';

@Injectable()
export class NestEcosystemCatalogAdapter implements EcosystemCatalogPort {
  constructor(private readonly ecosystem: EcosystemCloudService) {}

  products(): EcosystemProductsBundle {
    return this.ecosystem.products();
  }

  listProducts(): EcosystemProductRow[] {
    return ecosystemProductCatalog();
  }
}
