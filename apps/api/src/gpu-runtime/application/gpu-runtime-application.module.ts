import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GpuRuntimeModule } from '../gpu-runtime.module';
import { GPU_RUNTIME_CATALOG_PORT } from './ports';
import { NestGpuRuntimeCatalogAdapter } from './nest-gpu-runtime.adapter';
import { GPU_RUNTIME_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, GpuRuntimeModule],
  providers: [
    NestGpuRuntimeCatalogAdapter,
    { provide: GPU_RUNTIME_CATALOG_PORT, useExisting: NestGpuRuntimeCatalogAdapter },
    ...GPU_RUNTIME_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class GpuRuntimeApplicationModule {}
