import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiOperationsDashboardModule } from '../ai-operations-dashboard.module';
import { AI_OPERATIONS_DASHBOARD_CATALOG_PORT } from './ports';
import { NestAiOperationsDashboardCatalogAdapter } from './nest-ai-operations-dashboard.adapter';
import { AI_OPERATIONS_DASHBOARD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AiOperationsDashboardModule],
  providers: [
    NestAiOperationsDashboardCatalogAdapter,
    { provide: AI_OPERATIONS_DASHBOARD_CATALOG_PORT, useExisting: NestAiOperationsDashboardCatalogAdapter },
    ...AI_OPERATIONS_DASHBOARD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AiOperationsDashboardApplicationModule {}
