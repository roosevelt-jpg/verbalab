import { Module } from '@nestjs/common';
import { PromptIntelligenceController } from './prompt-intelligence.controller';
import { PromptIntelligenceService } from './prompt-intelligence.service';
import { PromptsModule } from '../prompts/prompts.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [PromptsModule, IdentityModule, PrismaModule, ApiKeysModule, AuditCoreModule],
  controllers: [PromptIntelligenceController],
  providers: [PromptIntelligenceService, TranslateAuthGuard],
  exports: [PromptIntelligenceService],
})
export class PromptIntelligenceModule {}
