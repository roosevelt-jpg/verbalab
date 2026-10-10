import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ContinuousEvaluationModule } from '../continuous-evaluation.module';
import { CONTINUOUS_EVALUATION_CATALOG_PORT } from './ports';
import { NestContinuousEvaluationCatalogAdapter } from './nest-continuous-evaluation.adapter';
import { CONTINUOUS_EVALUATION_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ContinuousEvaluationModule],
  providers: [
    NestContinuousEvaluationCatalogAdapter,
    { provide: CONTINUOUS_EVALUATION_CATALOG_PORT, useExisting: NestContinuousEvaluationCatalogAdapter },
    ...CONTINUOUS_EVALUATION_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ContinuousEvaluationApplicationModule {}
