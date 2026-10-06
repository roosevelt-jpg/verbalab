import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ModelEvaluationPlatformModule } from '../model-evaluation-platform.module';
import { MODEL_EVALUATION_PLATFORM_CATALOG_PORT } from './ports';
import { NestModelEvaluationPlatformCatalogAdapter } from './nest-model-evaluation-platform-catalog.adapter';
import { MODEL_EVALUATION_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ModelEvaluationPlatformModule],
  providers: [
    NestModelEvaluationPlatformCatalogAdapter,
    {
      provide: MODEL_EVALUATION_PLATFORM_CATALOG_PORT,
      useExisting: NestModelEvaluationPlatformCatalogAdapter,
    },
    ...MODEL_EVALUATION_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ModelEvaluationPlatformApplicationModule {}
