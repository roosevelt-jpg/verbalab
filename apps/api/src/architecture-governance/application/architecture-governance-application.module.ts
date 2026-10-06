import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ArchitectureGovernanceModule } from '../architecture-governance.module';
import { ARCHITECTURE_GOVERNANCE_CATALOG_PORT } from './ports';
import { NestArchitectureGovernanceCatalogAdapter } from './nest-architecture-governance.adapter';
import { ARCHITECTURE_GOVERNANCE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ArchitectureGovernanceModule],
  providers: [
    NestArchitectureGovernanceCatalogAdapter,
    { provide: ARCHITECTURE_GOVERNANCE_CATALOG_PORT, useExisting: NestArchitectureGovernanceCatalogAdapter },
    ...ARCHITECTURE_GOVERNANCE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ArchitectureGovernanceApplicationModule {}
