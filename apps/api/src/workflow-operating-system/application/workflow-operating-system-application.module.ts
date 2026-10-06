import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WorkflowOperatingSystemModule } from '../workflow-operating-system.module';
import { WORKFLOW_OPERATING_SYSTEM_CATALOG_PORT } from './ports';
import { NestWorkflowOperatingSystemCatalogAdapter } from './nest-workflow-operating-system.adapter';
import { WORKFLOW_OPERATING_SYSTEM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, WorkflowOperatingSystemModule],
  providers: [
    NestWorkflowOperatingSystemCatalogAdapter,
    { provide: WORKFLOW_OPERATING_SYSTEM_CATALOG_PORT, useExisting: NestWorkflowOperatingSystemCatalogAdapter },
    ...WORKFLOW_OPERATING_SYSTEM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class WorkflowOperatingSystemApplicationModule {}
