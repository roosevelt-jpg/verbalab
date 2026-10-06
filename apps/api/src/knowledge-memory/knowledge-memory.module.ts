import { Module } from '@nestjs/common';
import { KnowledgeMemoryController } from './knowledge-memory.controller';
import { KnowledgeMemoryService } from './knowledge-memory.service';
import { MemoryCloudModule } from '../memory-cloud/memory-cloud.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [MemoryCloudModule, IdentityModule, PrismaModule, ApiKeysModule, AuditCoreModule],
  controllers: [KnowledgeMemoryController],
  providers: [KnowledgeMemoryService, TranslateAuthGuard],
  exports: [KnowledgeMemoryService],
})
export class KnowledgeMemoryModule {}
