import { Module } from '@nestjs/common';
import { ResourceManagerController } from './resource-manager.controller';
import { ResourceManagerService } from './resource-manager.service';
import { GpuPlatformModule } from '../gpu-platform/gpu-platform.module';
import { GpuRuntimeModule } from '../gpu-runtime/gpu-runtime.module';
import { AiKernelModule } from '../ai-kernel/ai-kernel.module';

@Module({
  imports: [GpuPlatformModule, GpuRuntimeModule, AiKernelModule],
  controllers: [ResourceManagerController],
  providers: [ResourceManagerService],
  exports: [ResourceManagerService],
})
export class ResourceManagerModule {}
