import { Module } from '@nestjs/common';
import { AiOrchestrationController } from './ai-orchestration.controller';
import { AiOrchestrationService } from './ai-orchestration.service';
import { GatewayModule } from '../gateway/gateway.module';
import { TranslateModule } from '../translate/translate.module';
import { ChatModule } from '../chat/chat.module';
import { DecisionEngineModule } from '../decision-engine/decision-engine.module';
import { ContextEngineModule } from '../context-engine/context-engine.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    TranslateModule,
    ChatModule,
    DecisionEngineModule,
    ContextEngineModule,
    IdentityModule,
    PrismaModule,
    ApiKeysModule,
    AuditCoreModule,
  ],
  controllers: [AiOrchestrationController],
  providers: [AiOrchestrationService, TranslateAuthGuard],
  exports: [AiOrchestrationService],
})
export class AiOrchestrationModule {}
