import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InfrastructureEngineeringStandardsModule } from '../infrastructure-engineering-standards.module';
import { INFRASTRUCTURE_ENGINEERING_STANDARDS_CATALOG_PORT } from './ports';
import { NestInfrastructureEngineeringStandardsCatalogAdapter } from './nest-infrastructure-engineering-standards.adapter';
import { INFRASTRUCTURE_ENGINEERING_STANDARDS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, InfrastructureEngineeringStandardsModule],
  providers: [
    NestInfrastructureEngineeringStandardsCatalogAdapter,
    { provide: INFRASTRUCTURE_ENGINEERING_STANDARDS_CATALOG_PORT, useExisting: NestInfrastructureEngineeringStandardsCatalogAdapter },
    ...INFRASTRUCTURE_ENGINEERING_STANDARDS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class InfrastructureEngineeringStandardsApplicationModule {}
