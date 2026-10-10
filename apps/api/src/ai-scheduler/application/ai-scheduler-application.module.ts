import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiSchedulerModule } from '../ai-scheduler.module';
import { AI_SCHEDULER_CATALOG_PORT } from './ports';
import { NestAiSchedulerCatalogAdapter } from './nest-ai-scheduler.adapter';
import { AI_SCHEDULER_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AiSchedulerModule],
  providers: [
    NestAiSchedulerCatalogAdapter,
    { provide: AI_SCHEDULER_CATALOG_PORT, useExisting: NestAiSchedulerCatalogAdapter },
    ...AI_SCHEDULER_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AiSchedulerApplicationModule {}
