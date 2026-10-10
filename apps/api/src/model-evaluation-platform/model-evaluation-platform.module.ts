import { Module } from '@nestjs/common';
import { ModelEvaluationPlatformController } from './model-evaluation-platform.controller';
import { ModelEvaluationPlatformService } from './model-evaluation-platform.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { EvalModule } from '../eval/eval.module';

@Module({
  imports: [UsageModule, IdentityModule, EvalModule],
  controllers: [ModelEvaluationPlatformController],
  providers: [ModelEvaluationPlatformService],
  exports: [ModelEvaluationPlatformService],
})
export class ModelEvaluationPlatformModule {}
