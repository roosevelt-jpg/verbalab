import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConnectorMarketplaceModule } from '../connector-marketplace.module';
import { CONNECTOR_MARKETPLACE_CATALOG_PORT } from './ports';
import { NestConnectorMarketplaceCatalogAdapter } from './nest-connector-marketplace-catalog.adapter';
import { CONNECTOR_MARKETPLACE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ConnectorMarketplaceModule],
  providers: [
    NestConnectorMarketplaceCatalogAdapter,
    {
      provide: CONNECTOR_MARKETPLACE_CATALOG_PORT,
      useExisting: NestConnectorMarketplaceCatalogAdapter,
    },
    ...CONNECTOR_MARKETPLACE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ConnectorMarketplaceApplicationModule {}
