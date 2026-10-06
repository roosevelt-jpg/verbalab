import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EngineeringQualityPlatformModule } from '../engineering-quality-platform.module';
import { ENGINEERING_QUALITY_PLATFORM_CATALOG_PORT } from './ports';
import { NestEngineeringQualityPlatformCatalogAdapter } from './nest-engineering-quality-platform.adapter';
import { ENGINEERING_QUALITY_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, EngineeringQualityPlatformModule],
  providers: [
    NestEngineeringQualityPlatformCatalogAdapter,
    { provide: ENGINEERING_QUALITY_PLATFORM_CATALOG_PORT, useExisting: NestEngineeringQualityPlatformCatalogAdapter },
    ...ENGINEERING_QUALITY_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class EngineeringQualityPlatformApplicationModule {}
