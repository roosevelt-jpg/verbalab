import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ContinuousLearningModule } from '../continuous-learning.module';
import { CONTINUOUS_LEARNING_CATALOG_PORT } from './ports';
import { NestContinuousLearningCatalogAdapter } from './nest-continuous-learning.adapter';
import { CONTINUOUS_LEARNING_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ContinuousLearningModule],
  providers: [
    NestContinuousLearningCatalogAdapter,
    { provide: CONTINUOUS_LEARNING_CATALOG_PORT, useExisting: NestContinuousLearningCatalogAdapter },
    ...CONTINUOUS_LEARNING_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ContinuousLearningApplicationModule {}
