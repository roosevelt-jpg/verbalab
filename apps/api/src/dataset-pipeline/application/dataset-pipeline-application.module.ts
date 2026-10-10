import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatasetPipelineModule } from '../dataset-pipeline.module';
import { DATASET_PIPELINE_CATALOG_PORT } from './ports';
import { NestDatasetPipelineCatalogAdapter } from './nest-dataset-pipeline.adapter';
import { DATASET_PIPELINE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, DatasetPipelineModule],
  providers: [
    NestDatasetPipelineCatalogAdapter,
    { provide: DATASET_PIPELINE_CATALOG_PORT, useExisting: NestDatasetPipelineCatalogAdapter },
    ...DATASET_PIPELINE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class DatasetPipelineApplicationModule {}
