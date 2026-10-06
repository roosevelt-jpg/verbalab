import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PlatformEngineeringCloudModule } from '../platform-engineering-cloud.module';
import { PLATFORM_ENGINEERING_CLOUD_CATALOG_PORT } from './ports';
import { NestPlatformEngineeringCloudCatalogAdapter } from './nest-platform-engineering-cloud.adapter';
import { PLATFORM_ENGINEERING_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, PlatformEngineeringCloudModule],
  providers: [
    NestPlatformEngineeringCloudCatalogAdapter,
    { provide: PLATFORM_ENGINEERING_CLOUD_CATALOG_PORT, useExisting: NestPlatformEngineeringCloudCatalogAdapter },
    ...PLATFORM_ENGINEERING_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class PlatformEngineeringCloudApplicationModule {}
