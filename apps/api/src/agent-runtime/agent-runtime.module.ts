import { Module } from '@nestjs/common';
import { AgentRuntimeController } from './agent-runtime.controller';
import { AgentRuntimeService } from './agent-runtime.service';
import { AgentPolicyGate } from './agent-policy.gate';
import { MemoryRuntimeModule } from '../memory-runtime/memory-runtime.module';
import { ReasoningRuntimeModule } from '../reasoning-runtime/reasoning-runtime.module';
import { ContextRuntimeModule } from '../context-runtime/context-runtime.module';
import { PolicyRuntimeModule } from '../policy-runtime/policy-runtime.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    MemoryRuntimeModule,
    ReasoningRuntimeModule,
    ContextRuntimeModule,
    PolicyRuntimeModule,
    ApiKeysModule,
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
  ],
  controllers: [AgentRuntimeController],
  providers: [AgentRuntimeService, AgentPolicyGate, TranslateAuthGuard],
  exports: [AgentRuntimeService, AgentPolicyGate],
})
export class AgentRuntimeModule {}
