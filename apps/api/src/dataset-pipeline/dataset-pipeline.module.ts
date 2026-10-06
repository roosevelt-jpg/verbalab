import { Module } from '@nestjs/common';
import { DatasetPipelineController } from './dataset-pipeline.controller';
import { DatasetPipelineService } from './dataset-pipeline.service';

@Module({
  controllers: [DatasetPipelineController],
  providers: [DatasetPipelineService],
  exports: [DatasetPipelineService],
})
export class DatasetPipelineModule {}
