import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MlopsLlmopsCloudModule } from '../mlops-llmops-cloud.module';
import { MLOPS_LLMOPS_CLOUD_CATALOG_PORT } from './ports';
import { NestMlopsLlmopsCloudCatalogAdapter } from './nest-mlops-llmops-cloud.adapter';
import { MLOPS_LLMOPS_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, MlopsLlmopsCloudModule],
  providers: [
    NestMlopsLlmopsCloudCatalogAdapter,
    { provide: MLOPS_LLMOPS_CLOUD_CATALOG_PORT, useExisting: NestMlopsLlmopsCloudCatalogAdapter },
    ...MLOPS_LLMOPS_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class MlopsLlmopsCloudApplicationModule {}
