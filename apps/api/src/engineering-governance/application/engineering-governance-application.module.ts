import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EngineeringGovernanceModule } from '../engineering-governance.module';
import { ENGINEERING_GOVERNANCE_CATALOG_PORT } from './ports';
import { NestEngineeringGovernanceCatalogAdapter } from './nest-engineering-governance.adapter';
import { ENGINEERING_GOVERNANCE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, EngineeringGovernanceModule],
  providers: [
    NestEngineeringGovernanceCatalogAdapter,
    { provide: ENGINEERING_GOVERNANCE_CATALOG_PORT, useExisting: NestEngineeringGovernanceCatalogAdapter },
    ...ENGINEERING_GOVERNANCE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class EngineeringGovernanceApplicationModule {}
