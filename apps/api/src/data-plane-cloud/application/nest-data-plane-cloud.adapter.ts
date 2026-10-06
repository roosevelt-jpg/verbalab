import { Injectable } from '@nestjs/common';
import { DataPlaneCloudService } from '../data-plane-cloud.service';
import {
  DataPlaneCloudCatalogPort,
  DataPlaneCloudEngineBundle,
  DataPlaneCloudProductRow,
} from './ports';

@Injectable()
export class NestDataPlaneCloudCatalogAdapter implements DataPlaneCloudCatalogPort {
  constructor(private readonly service: DataPlaneCloudService) {}

  engine(): DataPlaneCloudEngineBundle {
    return this.service.products();
  }

  listProducts(): DataPlaneCloudProductRow[] {
    return this.service.products().products;
  }
}
