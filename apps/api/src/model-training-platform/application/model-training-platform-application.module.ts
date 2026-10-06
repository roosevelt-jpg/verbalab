import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ModelTrainingPlatformModule } from '../model-training-platform.module';
import { MODEL_TRAINING_PLATFORM_CATALOG_PORT } from './ports';
import { NestModelTrainingPlatformCatalogAdapter } from './nest-model-training-platform-catalog.adapter';
import { MODEL_TRAINING_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ModelTrainingPlatformModule],
  providers: [
    NestModelTrainingPlatformCatalogAdapter,
    {
      provide: MODEL_TRAINING_PLATFORM_CATALOG_PORT,
      useExisting: NestModelTrainingPlatformCatalogAdapter,
    },
    ...MODEL_TRAINING_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ModelTrainingPlatformApplicationModule {}
