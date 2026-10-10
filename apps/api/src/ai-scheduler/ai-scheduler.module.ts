import { Module } from '@nestjs/common';
import { AiSchedulerController } from './ai-scheduler.controller';
import { AiSchedulerService } from './ai-scheduler.service';
import { GlobalSchedulerModule } from '../global-scheduler/global-scheduler.module';
import { GpuRuntimeModule } from '../gpu-runtime/gpu-runtime.module';
import { GpuPlatformModule } from '../gpu-platform/gpu-platform.module';
import { WorkflowRuntimeModule } from '../workflow-runtime/workflow-runtime.module';
import { AgentRuntimeModule } from '../agent-runtime/agent-runtime.module';

@Module({
  imports: [GlobalSchedulerModule, GpuRuntimeModule, GpuPlatformModule, WorkflowRuntimeModule, AgentRuntimeModule],
  controllers: [AiSchedulerController],
  providers: [AiSchedulerService],
  exports: [AiSchedulerService],
})
export class AiSchedulerModule {}
