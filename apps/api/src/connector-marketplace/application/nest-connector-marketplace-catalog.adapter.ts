import { Injectable } from '@nestjs/common';
import { ConnectorMarketplaceService } from '../connector-marketplace.service';
import {
  ConnectorMarketplaceCatalogPort,
  ConnectorMarketplaceEngineBundle,
} from './ports';

@Injectable()
export class NestConnectorMarketplaceCatalogAdapter implements ConnectorMarketplaceCatalogPort {
  constructor(private readonly marketplace: ConnectorMarketplaceService) {}

  engine(): ConnectorMarketplaceEngineBundle {
    return this.marketplace.engine();
  }
}
