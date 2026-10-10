import { Injectable } from '@nestjs/common';
import { PlatformEngineeringCloudService } from '../platform-engineering-cloud.service';
import {
  PlatformEngineeringCloudCatalogPort,
  PlatformEngineeringCloudEngineBundle,
  PlatformEngineeringCloudProductRow,
} from './ports';

@Injectable()
export class NestPlatformEngineeringCloudCatalogAdapter implements PlatformEngineeringCloudCatalogPort {
  constructor(private readonly service: PlatformEngineeringCloudService) {}

  engine(): PlatformEngineeringCloudEngineBundle {
    return this.service.products();
  }

  listProducts(): PlatformEngineeringCloudProductRow[] {
    return this.service.products().products;
  }
}
