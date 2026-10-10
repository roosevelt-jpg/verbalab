import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EnterpriseEngineeringSystemModule } from '../enterprise-engineering-system.module';
import { ENTERPRISE_ENGINEERING_SYSTEM_CATALOG_PORT } from './ports';
import { NestEnterpriseEngineeringSystemCatalogAdapter } from './nest-enterprise-engineering-system.adapter';
import { ENTERPRISE_ENGINEERING_SYSTEM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, EnterpriseEngineeringSystemModule],
  providers: [
    NestEnterpriseEngineeringSystemCatalogAdapter,
    { provide: ENTERPRISE_ENGINEERING_SYSTEM_CATALOG_PORT, useExisting: NestEnterpriseEngineeringSystemCatalogAdapter },
    ...ENTERPRISE_ENGINEERING_SYSTEM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class EnterpriseEngineeringSystemApplicationModule {}
