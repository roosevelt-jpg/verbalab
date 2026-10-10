import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GoldenPathPlatformModule } from '../golden-path-platform.module';
import { GOLDEN_PATH_PLATFORM_CATALOG_PORT } from './ports';
import { NestGoldenPathPlatformCatalogAdapter } from './nest-golden-path-platform.adapter';
import { GOLDEN_PATH_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, GoldenPathPlatformModule],
  providers: [
    NestGoldenPathPlatformCatalogAdapter,
    { provide: GOLDEN_PATH_PLATFORM_CATALOG_PORT, useExisting: NestGoldenPathPlatformCatalogAdapter },
    ...GOLDEN_PATH_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class GoldenPathPlatformApplicationModule {}
