import { Module } from '@nestjs/common';
import { ModelTrainingPlatformController } from './model-training-platform.controller';
import { ModelTrainingPlatformService } from './model-training-platform.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { FineTunesModule } from '../finetunes/finetunes.module';

@Module({
  imports: [UsageModule, IdentityModule, FineTunesModule],
  controllers: [ModelTrainingPlatformController],
  providers: [ModelTrainingPlatformService],
  exports: [ModelTrainingPlatformService],
})
export class ModelTrainingPlatformModule {}
