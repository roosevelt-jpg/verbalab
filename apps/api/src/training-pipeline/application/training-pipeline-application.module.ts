import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TrainingPipelineModule } from '../training-pipeline.module';
import { TRAINING_PIPELINE_CATALOG_PORT } from './ports';
import { NestTrainingPipelineCatalogAdapter } from './nest-training-pipeline.adapter';
import { TRAINING_PIPELINE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, TrainingPipelineModule],
  providers: [
    NestTrainingPipelineCatalogAdapter,
    { provide: TRAINING_PIPELINE_CATALOG_PORT, useExisting: NestTrainingPipelineCatalogAdapter },
    ...TRAINING_PIPELINE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class TrainingPipelineApplicationModule {}
