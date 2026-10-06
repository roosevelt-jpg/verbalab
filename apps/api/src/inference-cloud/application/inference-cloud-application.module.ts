import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InferenceCloudModule } from '../inference-cloud.module';
import { INFERENCE_CATALOG_PORT } from './ports';
import { NestInferenceCatalogAdapter } from './nest-inference-catalog.adapter';
import { INFERENCE_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, InferenceCloudModule],
  providers: [
    NestInferenceCatalogAdapter,
    { provide: INFERENCE_CATALOG_PORT, useExisting: NestInferenceCatalogAdapter },
    ...INFERENCE_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class InferenceCloudApplicationModule {}
