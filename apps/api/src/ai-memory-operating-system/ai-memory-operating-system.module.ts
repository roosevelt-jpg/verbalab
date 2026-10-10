import { Module } from '@nestjs/common';
import { AiMemoryOperatingSystemController } from './ai-memory-operating-system.controller';
import { AiMemoryOperatingSystemService } from './ai-memory-operating-system.service';
import { MemoryRuntimeModule } from '../memory-runtime/memory-runtime.module';
import { MemoryFabricModule } from '../memory-fabric/memory-fabric.module';
import { KnowledgeMemoryModule } from '../knowledge-memory/knowledge-memory.module';
import { AiKernelModule } from '../ai-kernel/ai-kernel.module';

@Module({
  imports: [MemoryRuntimeModule, MemoryFabricModule, KnowledgeMemoryModule, AiKernelModule],
  controllers: [AiMemoryOperatingSystemController],
  providers: [AiMemoryOperatingSystemService],
  exports: [AiMemoryOperatingSystemService],
})
export class AiMemoryOperatingSystemModule {}
