import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiGovernancePlatformModule } from '../ai-governance-platform.module';
import { AI_GOVERNANCE_PLATFORM_CATALOG_PORT } from './ports';
import { NestAiGovernancePlatformCatalogAdapter } from './nest-ai-governance-platform.adapter';
import { AI_GOVERNANCE_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AiGovernancePlatformModule],
  providers: [
    NestAiGovernancePlatformCatalogAdapter,
    { provide: AI_GOVERNANCE_PLATFORM_CATALOG_PORT, useExisting: NestAiGovernancePlatformCatalogAdapter },
    ...AI_GOVERNANCE_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AiGovernancePlatformApplicationModule {}
