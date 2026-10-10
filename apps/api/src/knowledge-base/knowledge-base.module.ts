import { Module } from '@nestjs/common';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [KnowledgeModule, IdentityModule, PrismaModule, ApiKeysModule, AuditCoreModule],
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService, TranslateAuthGuard],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
