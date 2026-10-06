import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SyntheticDataPlatformModule } from '../synthetic-data-platform.module';
import { SYNTHETIC_DATA_PLATFORM_CATALOG_PORT } from './ports';
import { NestSyntheticDataPlatformCatalogAdapter } from './nest-synthetic-data-platform.adapter';
import { SYNTHETIC_DATA_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, SyntheticDataPlatformModule],
  providers: [
    NestSyntheticDataPlatformCatalogAdapter,
    { provide: SYNTHETIC_DATA_PLATFORM_CATALOG_PORT, useExisting: NestSyntheticDataPlatformCatalogAdapter },
    ...SYNTHETIC_DATA_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class SyntheticDataPlatformApplicationModule {}
