import { Module } from '@nestjs/common';
import { ReasoningRuntimeController } from './reasoning-runtime.controller';
import { ReasoningRuntimeService } from './reasoning-runtime.service';
import { ReasoningCloudModule } from '../reasoning-cloud/reasoning-cloud.module';
import { AiRouterModule } from '../ai-router/ai-router.module';
import { DecisionEngineModule } from '../decision-engine/decision-engine.module';
import { MemoryCloudModule } from '../memory-cloud/memory-cloud.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    ReasoningCloudModule,
    AiRouterModule,
    DecisionEngineModule,
    MemoryCloudModule,
    ApiKeysModule,
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
  ],
  controllers: [ReasoningRuntimeController],
  providers: [ReasoningRuntimeService, TranslateAuthGuard],
  exports: [ReasoningRuntimeService],
})
export class ReasoningRuntimeModule {}
