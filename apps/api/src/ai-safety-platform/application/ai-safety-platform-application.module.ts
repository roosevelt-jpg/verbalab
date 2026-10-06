import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiSafetyPlatformModule } from '../ai-safety-platform.module';
import { AI_SAFETY_PLATFORM_CATALOG_PORT } from './ports';
import { NestAiSafetyPlatformCatalogAdapter } from './nest-ai-safety-platform.adapter';
import { AI_SAFETY_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AiSafetyPlatformModule],
  providers: [
    NestAiSafetyPlatformCatalogAdapter,
    { provide: AI_SAFETY_PLATFORM_CATALOG_PORT, useExisting: NestAiSafetyPlatformCatalogAdapter },
    ...AI_SAFETY_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AiSafetyPlatformApplicationModule {}
