import { Injectable } from '@nestjs/common';
import { ControlPlaneCloudService } from '../control-plane-cloud.service';
import {
  ControlPlaneCloudCatalogPort,
  ControlPlaneCloudEngineBundle,
  ControlPlaneCloudProductRow,
} from './ports';

@Injectable
export class NestControlPlaneCloudCatalogAdapter implements ControlPlaneCloudCatalogPort {
  constructor(private readonly service: ControlPlaneCloudService) {}

  engine: ControlPlaneCloudEngineBundle {
    return this.service.products;
  }

  listProducts: ControlPlaneCloudProductRow[] {
    return this.service.products.products;
  }
}
