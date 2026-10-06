import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RagopsPlatformModule } from '../ragops-platform.module';
import { RAGOPS_PLATFORM_CATALOG_PORT } from './ports';
import { NestRagopsPlatformCatalogAdapter } from './nest-ragops-platform.adapter';
import { RAGOPS_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, RagopsPlatformModule],
  providers: [
    NestRagopsPlatformCatalogAdapter,
    { provide: RAGOPS_PLATFORM_CATALOG_PORT, useExisting: NestRagopsPlatformCatalogAdapter },
    ...RAGOPS_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class RagopsPlatformApplicationModule {}
