import { Module } from '@nestjs/common';
import { KnowledgeIntelligenceController } from './knowledge-intelligence.controller';
import { KnowledgeIntelligenceService } from './knowledge-intelligence.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [IdentityModule, PrismaModule, ApiKeysModule, AuditCoreModule],
  controllers: [KnowledgeIntelligenceController],
  providers: [KnowledgeIntelligenceService, TranslateAuthGuard],
  exports: [KnowledgeIntelligenceService],
})
export class KnowledgeIntelligenceModule {}
