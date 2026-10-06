import { Module } from '@nestjs/common';
import { ContextEngineController } from './context-engine.controller';
import { ContextEngineService } from './context-engine.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { MemoryCloudModule } from '../memory-cloud/memory-cloud.module';
import { KnowledgeGraphModule } from '../knowledge-graph/knowledge-graph.module';
import { PromptsModule } from '../prompts/prompts.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    KnowledgeModule,
    MemoryCloudModule,
    KnowledgeGraphModule,
    PromptsModule,
    IdentityModule,
    PrismaModule,
    ApiKeysModule,
    AuditCoreModule,
  ],
  controllers: [ContextEngineController],
  providers: [ContextEngineService, TranslateAuthGuard],
  exports: [ContextEngineService],
})
export class ContextEngineModule {}
