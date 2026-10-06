import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PromptopsPlatformModule } from '../promptops-platform.module';
import { PROMPTOPS_PLATFORM_CATALOG_PORT } from './ports';
import { NestPromptopsPlatformCatalogAdapter } from './nest-promptops-platform.adapter';
import { PROMPTOPS_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, PromptopsPlatformModule],
  providers: [
    NestPromptopsPlatformCatalogAdapter,
    { provide: PROMPTOPS_PLATFORM_CATALOG_PORT, useExisting: NestPromptopsPlatformCatalogAdapter },
    ...PROMPTOPS_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class PromptopsPlatformApplicationModule {}
