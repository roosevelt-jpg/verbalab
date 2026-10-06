import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GlobalSchedulerModule } from '../global-scheduler.module';
import { GLOBAL_SCHEDULER_CATALOG_PORT } from './ports';
import { NestGlobalSchedulerCatalogAdapter } from './nest-global-scheduler.adapter';
import { GLOBAL_SCHEDULER_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, GlobalSchedulerModule],
  providers: [
    NestGlobalSchedulerCatalogAdapter,
    { provide: GLOBAL_SCHEDULER_CATALOG_PORT, useExisting: NestGlobalSchedulerCatalogAdapter },
    ...GLOBAL_SCHEDULER_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class GlobalSchedulerApplicationModule {}
