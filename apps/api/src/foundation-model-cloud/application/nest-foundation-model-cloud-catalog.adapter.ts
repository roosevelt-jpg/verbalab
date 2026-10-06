import { Injectable } from '@nestjs/common';
import { FoundationModelCloudService } from '../foundation-model-cloud.service';
import { foundationModelCloudCatalog } from '../foundation-model-cloud.catalog';
import {
  FoundationModelCloudCatalogPort,
  FmcProductRow,
  FmcProductsBundle,
} from './ports';

@Injectable
export class NestFoundationModelCloudCatalogAdapter
  implements FoundationModelCloudCatalogPort
{
  constructor(private readonly cloud: FoundationModelCloudService) {}

  products: FmcProductsBundle {
    return this.cloud.products;
  }

  listProducts: FmcProductRow[] {
    return foundationModelCloudCatalog;
  }
}
