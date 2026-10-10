import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EvaluationPlatformModule } from '../evaluation-platform.module';
import { EVALUATION_PLATFORM_CATALOG_PORT } from './ports';
import { NestEvaluationPlatformCatalogAdapter } from './nest-evaluation-platform.adapter';
import { EVALUATION_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, EvaluationPlatformModule],
  providers: [
    NestEvaluationPlatformCatalogAdapter,
    { provide: EVALUATION_PLATFORM_CATALOG_PORT, useExisting: NestEvaluationPlatformCatalogAdapter },
    ...EVALUATION_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class EvaluationPlatformApplicationModule {}
