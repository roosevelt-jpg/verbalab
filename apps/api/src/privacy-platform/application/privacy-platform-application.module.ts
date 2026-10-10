import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrivacyPlatformModule } from '../privacy-platform.module';
import { PRIVACY_PLATFORM_CATALOG_PORT } from './ports';
import { NestPrivacyPlatformCatalogAdapter } from './nest-privacy-platform.adapter';
import { PRIVACY_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, PrivacyPlatformModule],
  providers: [
    NestPrivacyPlatformCatalogAdapter,
    { provide: PRIVACY_PLATFORM_CATALOG_PORT, useExisting: NestPrivacyPlatformCatalogAdapter },
    ...PRIVACY_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class PrivacyPlatformApplicationModule {}
