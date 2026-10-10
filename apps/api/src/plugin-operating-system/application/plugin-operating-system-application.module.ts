import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PluginOperatingSystemModule } from '../plugin-operating-system.module';
import { PLUGIN_OPERATING_SYSTEM_CATALOG_PORT } from './ports';
import { NestPluginOperatingSystemCatalogAdapter } from './nest-plugin-operating-system.adapter';
import { PLUGIN_OPERATING_SYSTEM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, PluginOperatingSystemModule],
  providers: [
    NestPluginOperatingSystemCatalogAdapter,
    { provide: PLUGIN_OPERATING_SYSTEM_CATALOG_PORT, useExisting: NestPluginOperatingSystemCatalogAdapter },
    ...PLUGIN_OPERATING_SYSTEM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class PluginOperatingSystemApplicationModule {}
