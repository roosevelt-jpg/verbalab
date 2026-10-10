import { Module } from '@nestjs/common';
import { PromptRuntimeController } from './prompt-runtime.controller';
import { PromptRuntimeService } from './prompt-runtime.service';
import { PromptsModule } from '../prompts/prompts.module';
import { PromptIntelligenceModule } from '../prompt-intelligence/prompt-intelligence.module';
import { IntelligentCacheModule } from '../intelligent-cache/intelligent-cache.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    PromptsModule,
    PromptIntelligenceModule,
    IntelligentCacheModule,
    ApiKeysModule,
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
  ],
  controllers: [PromptRuntimeController],
  providers: [PromptRuntimeService, TranslateAuthGuard],
  exports: [PromptRuntimeService],
})
export class PromptRuntimeModule {}
