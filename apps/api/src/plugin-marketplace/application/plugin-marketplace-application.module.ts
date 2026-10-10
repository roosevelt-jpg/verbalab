import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PluginMarketplaceModule } from '../plugin-marketplace.module';
import { PLUGIN_MARKETPLACE_CATALOG_PORT } from './ports';
import { NestPluginMarketplaceCatalogAdapter } from './nest-plugin-marketplace-catalog.adapter';
import { PLUGIN_MARKETPLACE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, PluginMarketplaceModule],
  providers: [
    NestPluginMarketplaceCatalogAdapter,
    {
      provide: PLUGIN_MARKETPLACE_CATALOG_PORT,
      useExisting: NestPluginMarketplaceCatalogAdapter,
    },
    ...PLUGIN_MARKETPLACE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class PluginMarketplaceApplicationModule {}
