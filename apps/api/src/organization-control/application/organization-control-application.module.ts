import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OrganizationControlModule } from '../organization-control.module';
import { ORGANIZATION_CONTROL_CATALOG_PORT } from './ports';
import { NestOrganizationControlCatalogAdapter } from './nest-organization-control.adapter';
import { ORGANIZATION_CONTROL_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, OrganizationControlModule],
  providers: [
    NestOrganizationControlCatalogAdapter,
    { provide: ORGANIZATION_CONTROL_CATALOG_PORT, useExisting: NestOrganizationControlCatalogAdapter },
    ...ORGANIZATION_CONTROL_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class OrganizationControlApplicationModule {}
