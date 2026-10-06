import { Module } from '@nestjs/common';
import { GpuRuntimeController } from './gpu-runtime.controller';
import { GpuRuntimeService } from './gpu-runtime.service';
import { GpuPlatformModule } from '../gpu-platform/gpu-platform.module';

@Module({
  imports: [GpuPlatformModule],
  controllers: [GpuRuntimeController],
  providers: [GpuRuntimeService],
  exports: [GpuRuntimeService],
})
export class GpuRuntimeModule {}
