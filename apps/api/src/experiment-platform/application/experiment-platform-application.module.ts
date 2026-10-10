import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ExperimentPlatformModule } from '../experiment-platform.module';
import { EXPERIMENT_PLATFORM_CATALOG_PORT } from './ports';
import { NestExperimentPlatformCatalogAdapter } from './nest-experiment-platform.adapter';
import { EXPERIMENT_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ExperimentPlatformModule],
  providers: [
    NestExperimentPlatformCatalogAdapter,
    { provide: EXPERIMENT_PLATFORM_CATALOG_PORT, useExisting: NestExperimentPlatformCatalogAdapter },
    ...EXPERIMENT_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ExperimentPlatformApplicationModule {}
