import { Injectable } from '@nestjs/common';
import { TrustCloudService } from '../trust-cloud.service';
import {
  TrustCloudCatalogPort,
  TrustCloudEngineBundle,
  TrustCloudProductRow,
} from './ports';

@Injectable()
export class NestTrustCloudCatalogAdapter implements TrustCloudCatalogPort {
  constructor(private readonly service: TrustCloudService) {}

  engine(): TrustCloudEngineBundle {
    return this.service.products();
  }

  listProducts(): TrustCloudProductRow[] {
    return this.service.products().products;
  }
}
