import { Module } from '@nestjs/common';
import { WorkflowOperatingSystemController } from './workflow-operating-system.controller';
import { WorkflowOperatingSystemService } from './workflow-operating-system.service';
import { WorkflowRuntimeModule } from '../workflow-runtime/workflow-runtime.module';
import { WorkflowMarketplaceModule } from '../workflow-marketplace/workflow-marketplace.module';
import { AiKernelModule } from '../ai-kernel/ai-kernel.module';

@Module({
  imports: [WorkflowRuntimeModule, WorkflowMarketplaceModule, AiKernelModule],
  controllers: [WorkflowOperatingSystemController],
  providers: [WorkflowOperatingSystemService],
  exports: [WorkflowOperatingSystemService],
})
export class WorkflowOperatingSystemModule {}
