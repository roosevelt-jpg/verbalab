import { Injectable } from '@nestjs/common';
import { IntelligenceCloudService } from '../intelligence-cloud.service';
import { intelligenceProductCatalog } from '../intelligence-products.catalog';
import {
  IntelligenceCatalogPort,
  IntelligenceProductRow,
  IntelligenceProductsBundle,
} from './ports';

@Injectable
export class NestIntelligenceCatalogAdapter implements IntelligenceCatalogPort {
  constructor(private readonly intelligenceCloud: IntelligenceCloudService) {}

  products: IntelligenceProductsBundle {
    return this.intelligenceCloud.products;
  }

  listProducts: IntelligenceProductRow[] {
    return intelligenceProductCatalog;
  }
}
