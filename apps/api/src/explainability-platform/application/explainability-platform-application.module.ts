import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ExplainabilityPlatformModule } from '../explainability-platform.module';
import { EXPLAINABILITY_PLATFORM_CATALOG_PORT } from './ports';
import { NestExplainabilityPlatformCatalogAdapter } from './nest-explainability-platform.adapter';
import { EXPLAINABILITY_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ExplainabilityPlatformModule],
  providers: [
    NestExplainabilityPlatformCatalogAdapter,
    { provide: EXPLAINABILITY_PLATFORM_CATALOG_PORT, useExisting: NestExplainabilityPlatformCatalogAdapter },
    ...EXPLAINABILITY_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ExplainabilityPlatformApplicationModule {}
