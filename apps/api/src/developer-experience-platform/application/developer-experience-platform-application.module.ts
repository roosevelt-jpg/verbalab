import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DeveloperExperiencePlatformModule } from '../developer-experience-platform.module';
import { DEVELOPER_EXPERIENCE_PLATFORM_CATALOG_PORT } from './ports';
import { NestDeveloperExperiencePlatformCatalogAdapter } from './nest-developer-experience-platform.adapter';
import { DEVELOPER_EXPERIENCE_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, DeveloperExperiencePlatformModule],
  providers: [
    NestDeveloperExperiencePlatformCatalogAdapter,
    { provide: DEVELOPER_EXPERIENCE_PLATFORM_CATALOG_PORT, useExisting: NestDeveloperExperiencePlatformCatalogAdapter },
    ...DEVELOPER_EXPERIENCE_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class DeveloperExperiencePlatformApplicationModule {}
