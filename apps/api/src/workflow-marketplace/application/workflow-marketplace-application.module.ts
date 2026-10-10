import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WorkflowMarketplaceModule } from '../workflow-marketplace.module';
import { WORKFLOW_MARKETPLACE_CATALOG_PORT } from './ports';
import { NestWorkflowMarketplaceCatalogAdapter } from './nest-workflow-marketplace-catalog.adapter';
import { WORKFLOW_MARKETPLACE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, WorkflowMarketplaceModule],
  providers: [
    NestWorkflowMarketplaceCatalogAdapter,
    {
      provide: WORKFLOW_MARKETPLACE_CATALOG_PORT,
      useExisting: NestWorkflowMarketplaceCatalogAdapter,
    },
    ...WORKFLOW_MARKETPLACE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class WorkflowMarketplaceApplicationModule {}
