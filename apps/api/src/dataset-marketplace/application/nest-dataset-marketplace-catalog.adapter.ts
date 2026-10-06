import { Injectable } from '@nestjs/common';
import { DatasetMarketplaceService } from '../dataset-marketplace.service';
import {
  DatasetMarketplaceCatalogPort,
  DatasetMarketplaceEngineBundle,
} from './ports';

@Injectable
export class NestDatasetMarketplaceCatalogAdapter implements DatasetMarketplaceCatalogPort {
  constructor(private readonly marketplace: DatasetMarketplaceService) {}

  engine: DatasetMarketplaceEngineBundle {
    return this.marketplace.engine;
  }
}
