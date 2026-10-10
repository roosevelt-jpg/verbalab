import { Module } from '@nestjs/common';
import { KnowledgeGraphController } from './knowledge-graph.controller';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [IdentityModule, PrismaModule, ApiKeysModule, AuditCoreModule],
  controllers: [KnowledgeGraphController],
  providers: [KnowledgeGraphService, TranslateAuthGuard],
  exports: [KnowledgeGraphService],
})
export class KnowledgeGraphModule {}
