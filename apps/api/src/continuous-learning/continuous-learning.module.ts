import { Module } from '@nestjs/common';
import { ContinuousLearningController } from './continuous-learning.controller';
import { ContinuousLearningService } from './continuous-learning.service';

@Module({
  controllers: [ContinuousLearningController],
  providers: [ContinuousLearningService],
  exports: [ContinuousLearningService],
})
export class ContinuousLearningModule {}
