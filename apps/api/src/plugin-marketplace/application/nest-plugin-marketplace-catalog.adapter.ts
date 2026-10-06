import { Injectable } from '@nestjs/common';
import { PluginMarketplaceService } from '../plugin-marketplace.service';
import {
  PluginMarketplaceCatalogPort,
  PluginMarketplaceEngineBundle,
} from './ports';

@Injectable()
export class NestPluginMarketplaceCatalogAdapter implements PluginMarketplaceCatalogPort {
  constructor(private readonly marketplace: PluginMarketplaceService) {}

  engine(): PluginMarketplaceEngineBundle {
    return this.marketplace.engine();
  }
}
