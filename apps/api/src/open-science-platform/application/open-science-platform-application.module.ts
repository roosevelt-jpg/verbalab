import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OpenSciencePlatformModule } from '../open-science-platform.module';
import { OPEN_SCIENCE_PLATFORM_CATALOG_PORT } from './ports';
import { NestOpenSciencePlatformCatalogAdapter } from './nest-open-science-platform.adapter';
import { OPEN_SCIENCE_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, OpenSciencePlatformModule],
  providers: [
    NestOpenSciencePlatformCatalogAdapter,
    { provide: OPEN_SCIENCE_PLATFORM_CATALOG_PORT, useExisting: NestOpenSciencePlatformCatalogAdapter },
    ...OPEN_SCIENCE_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class OpenSciencePlatformApplicationModule {}
