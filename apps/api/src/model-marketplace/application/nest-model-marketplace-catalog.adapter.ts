import { Injectable } from '@nestjs/common';
import { ModelMarketplaceService } from '../model-marketplace.service';
import {
  ModelMarketplaceCatalogPort,
  ModelMarketplaceEngineBundle,
} from './ports';

@Injectable()
export class NestModelMarketplaceCatalogAdapter implements ModelMarketplaceCatalogPort {
  constructor(private readonly marketplace: ModelMarketplaceService) {}

  engine(): ModelMarketplaceEngineBundle {
    return this.marketplace.engine();
  }
}
