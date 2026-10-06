import { Module } from '@nestjs/common';
import { EvaluationPlatformController } from './evaluation-platform.controller';
import { EvaluationPlatformService } from './evaluation-platform.service';

@Module({
  controllers: [EvaluationPlatformController],
  providers: [EvaluationPlatformService],
  exports: [EvaluationPlatformService],
})
export class EvaluationPlatformModule {}
