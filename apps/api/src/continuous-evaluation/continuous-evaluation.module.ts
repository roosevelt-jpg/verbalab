import { Module } from '@nestjs/common';
import { ContinuousEvaluationController } from './continuous-evaluation.controller';
import { ContinuousEvaluationService } from './continuous-evaluation.service';

@Module({
  controllers: [ContinuousEvaluationController],
  providers: [ContinuousEvaluationService],
  exports: [ContinuousEvaluationService],
})
export class ContinuousEvaluationModule {}
