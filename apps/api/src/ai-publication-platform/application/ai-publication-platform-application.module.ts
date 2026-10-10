import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiPublicationPlatformModule } from '../ai-publication-platform.module';
import { AI_PUBLICATION_PLATFORM_CATALOG_PORT } from './ports';
import { NestAiPublicationPlatformCatalogAdapter } from './nest-ai-publication-platform.adapter';
import { AI_PUBLICATION_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AiPublicationPlatformModule],
  providers: [
    NestAiPublicationPlatformCatalogAdapter,
    { provide: AI_PUBLICATION_PLATFORM_CATALOG_PORT, useExisting: NestAiPublicationPlatformCatalogAdapter },
    ...AI_PUBLICATION_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AiPublicationPlatformApplicationModule {}
