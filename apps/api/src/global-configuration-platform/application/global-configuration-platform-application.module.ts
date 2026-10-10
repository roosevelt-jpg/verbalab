import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GlobalConfigurationPlatformModule } from '../global-configuration-platform.module';
import { GLOBAL_CONFIGURATION_PLATFORM_CATALOG_PORT } from './ports';
import { NestGlobalConfigurationPlatformCatalogAdapter } from './nest-global-configuration-platform.adapter';
import { GLOBAL_CONFIGURATION_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, GlobalConfigurationPlatformModule],
  providers: [
    NestGlobalConfigurationPlatformCatalogAdapter,
    { provide: GLOBAL_CONFIGURATION_PLATFORM_CATALOG_PORT, useExisting: NestGlobalConfigurationPlatformCatalogAdapter },
    ...GLOBAL_CONFIGURATION_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class GlobalConfigurationPlatformApplicationModule {}
