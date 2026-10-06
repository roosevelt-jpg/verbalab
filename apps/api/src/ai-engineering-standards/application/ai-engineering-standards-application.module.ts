import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiEngineeringStandardsModule } from '../ai-engineering-standards.module';
import { AI_ENGINEERING_STANDARDS_CATALOG_PORT } from './ports';
import { NestAiEngineeringStandardsCatalogAdapter } from './nest-ai-engineering-standards.adapter';
import { AI_ENGINEERING_STANDARDS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AiEngineeringStandardsModule],
  providers: [
    NestAiEngineeringStandardsCatalogAdapter,
    { provide: AI_ENGINEERING_STANDARDS_CATALOG_PORT, useExisting: NestAiEngineeringStandardsCatalogAdapter },
    ...AI_ENGINEERING_STANDARDS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AiEngineeringStandardsApplicationModule {}
