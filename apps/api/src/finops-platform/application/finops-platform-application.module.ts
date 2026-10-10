import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { FinopsPlatformModule } from '../finops-platform.module';
import { FINOPS_PLATFORM_CATALOG_PORT } from './ports';
import { NestFinopsPlatformCatalogAdapter } from './nest-finops-platform.adapter';
import { FINOPS_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, FinopsPlatformModule],
  providers: [
    NestFinopsPlatformCatalogAdapter,
    { provide: FINOPS_PLATFORM_CATALOG_PORT, useExisting: NestFinopsPlatformCatalogAdapter },
    ...FINOPS_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class FinopsPlatformApplicationModule {}
