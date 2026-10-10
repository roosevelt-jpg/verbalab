import { Module } from '@nestjs/common';
import { ReasoningCloudController } from './reasoning-cloud.controller';
import { ReasoningCloudService } from './reasoning-cloud.service';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { ContextEngineModule } from '../context-engine/context-engine.module';
import { KnowledgeGraphModule } from '../knowledge-graph/knowledge-graph.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    UsageModule,
    ContextEngineModule,
    KnowledgeGraphModule,
    IdentityModule,
    PrismaModule,
    ApiKeysModule,
    AuditCoreModule,
  ],
  controllers: [ReasoningCloudController],
  providers: [ReasoningCloudService, TranslateAuthGuard],
  exports: [ReasoningCloudService],
})
export class ReasoningCloudModule {}
