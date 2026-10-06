import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiDriftDetectionModule } from '../ai-drift-detection.module';
import { AI_DRIFT_DETECTION_CATALOG_PORT } from './ports';
import { NestAiDriftDetectionCatalogAdapter } from './nest-ai-drift-detection.adapter';
import { AI_DRIFT_DETECTION_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AiDriftDetectionModule],
  providers: [
    NestAiDriftDetectionCatalogAdapter,
    { provide: AI_DRIFT_DETECTION_CATALOG_PORT, useExisting: NestAiDriftDetectionCatalogAdapter },
    ...AI_DRIFT_DETECTION_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AiDriftDetectionApplicationModule {}
