import { Module } from '@nestjs/common';
import { KnowledgeApisController } from './knowledge-apis.controller';
import { KnowledgeApisService } from './knowledge-apis.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [IdentityModule, PrismaModule, ApiKeysModule, AuditCoreModule],
  controllers: [KnowledgeApisController],
  providers: [KnowledgeApisService, TranslateAuthGuard],
  exports: [KnowledgeApisService],
})
export class KnowledgeApisModule {}
