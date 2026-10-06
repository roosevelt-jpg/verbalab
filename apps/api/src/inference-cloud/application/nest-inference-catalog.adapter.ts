import { Injectable } from '@nestjs/common';
import { InferenceCloudService } from '../inference-cloud.service';
import { inferenceProductCatalog } from '../inference-products.catalog';
import {
  InferenceCatalogPort,
  InferenceProductRow,
  InferenceProductsBundle,
} from './ports';

@Injectable()
export class NestInferenceCatalogAdapter implements InferenceCatalogPort {
  constructor(private readonly inferenceCloud: InferenceCloudService) {}

  products(): InferenceProductsBundle {
    return this.inferenceCloud.products();
  }

  listProducts(): InferenceProductRow[] {
    return inferenceProductCatalog();
  }
}
