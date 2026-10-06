import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiKernelModule } from '../ai-kernel.module';
import { AI_KERNEL_CATALOG_PORT } from './ports';
import { NestAiKernelCatalogAdapter } from './nest-ai-kernel-catalog.adapter';
import { AI_KERNEL_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AiKernelModule],
  providers: [
    NestAiKernelCatalogAdapter,
    { provide: AI_KERNEL_CATALOG_PORT, useExisting: NestAiKernelCatalogAdapter },
    ...AI_KERNEL_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AiKernelApplicationModule {}
