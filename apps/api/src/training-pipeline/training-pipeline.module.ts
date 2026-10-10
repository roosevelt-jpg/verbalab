import { Module } from '@nestjs/common';
import { TrainingPipelineController } from './training-pipeline.controller';
import { TrainingPipelineService } from './training-pipeline.service';

@Module({
  controllers: [TrainingPipelineController],
  providers: [TrainingPipelineService],
  exports: [TrainingPipelineService],
})
export class TrainingPipelineModule {}
