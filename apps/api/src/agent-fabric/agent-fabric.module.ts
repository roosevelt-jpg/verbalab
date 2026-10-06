import { Module } from '@nestjs/common';
import { AgentFabricController } from './agent-fabric.controller';
import { AgentFabricService } from './agent-fabric.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentRuntimeModule } from '../agent-runtime/agent-runtime.module';
import { EventFabricModule } from '../event-fabric/event-fabric.module';
import { PolicyFabricModule } from '../policy-fabric/policy-fabric.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    UsageModule,
    IdentityModule,
    PrismaModule,
    AgentRuntimeModule,
    EventFabricModule,
    PolicyFabricModule,
    ApiKeysModule,
  ],
  controllers: [AgentFabricController],
  providers: [AgentFabricService, TranslateAuthGuard],
  exports: [AgentFabricService],
})
export class AgentFabricModule {}
