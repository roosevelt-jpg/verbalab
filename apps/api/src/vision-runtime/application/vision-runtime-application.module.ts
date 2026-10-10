import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { VisionRuntimeModule } from '../vision-runtime.module';
import { VISION_RUNTIME_CATALOG_PORT } from './ports';
import { NestVisionRuntimeCatalogAdapter } from './nest-vision-runtime.adapter';
import { VISION_RUNTIME_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, VisionRuntimeModule],
  providers: [
    NestVisionRuntimeCatalogAdapter,
    { provide: VISION_RUNTIME_CATALOG_PORT, useExisting: NestVisionRuntimeCatalogAdapter },
    ...VISION_RUNTIME_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class VisionRuntimeApplicationModule {}
