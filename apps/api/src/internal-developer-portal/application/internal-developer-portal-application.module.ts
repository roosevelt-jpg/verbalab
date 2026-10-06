import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InternalDeveloperPortalModule } from '../internal-developer-portal.module';
import { INTERNAL_DEVELOPER_PORTAL_CATALOG_PORT } from './ports';
import { NestInternalDeveloperPortalCatalogAdapter } from './nest-internal-developer-portal.adapter';
import { INTERNAL_DEVELOPER_PORTAL_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, InternalDeveloperPortalModule],
  providers: [
    NestInternalDeveloperPortalCatalogAdapter,
    { provide: INTERNAL_DEVELOPER_PORTAL_CATALOG_PORT, useExisting: NestInternalDeveloperPortalCatalogAdapter },
    ...INTERNAL_DEVELOPER_PORTAL_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class InternalDeveloperPortalApplicationModule {}
