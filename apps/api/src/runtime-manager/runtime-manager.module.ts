import { Module } from '@nestjs/common';
import { RuntimeManagerController } from './runtime-manager.controller';
import { RuntimeManagerService } from './runtime-manager.service';
import { AiKernelModule } from '../ai-kernel/ai-kernel.module';
import { AgentRuntimeModule } from '../agent-runtime/agent-runtime.module';
import { WorkflowRuntimeModule } from '../workflow-runtime/workflow-runtime.module';
import { MemoryRuntimeModule } from '../memory-runtime/memory-runtime.module';
import { PolicyRuntimeModule } from '../policy-runtime/policy-runtime.module';
import { PromptRuntimeModule } from '../prompt-runtime/prompt-runtime.module';
import { ContextRuntimeModule } from '../context-runtime/context-runtime.module';
import { BatchRuntimeModule } from '../batch-runtime/batch-runtime.module';
import { StreamingRuntimeModule } from '../streaming-runtime/streaming-runtime.module';
import { DataPlaneCloudModule } from '../data-plane-cloud/data-plane-cloud.module';

@Module({
  imports: [AiKernelModule, AgentRuntimeModule, WorkflowRuntimeModule, MemoryRuntimeModule, PolicyRuntimeModule, PromptRuntimeModule, ContextRuntimeModule, BatchRuntimeModule, StreamingRuntimeModule, DataPlaneCloudModule],
  controllers: [RuntimeManagerController],
  providers: [RuntimeManagerService],
  exports: [RuntimeManagerService],
})
export class RuntimeManagerModule {}
