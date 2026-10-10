import { Module } from '@nestjs/common';
import { PolicyFabricController } from './policy-fabric.controller';
import { PolicyFabricService } from './policy-fabric.service';
import { FabricPolicyGate } from './fabric-policy.gate';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PolicyRuntimeModule } from '../policy-runtime/policy-runtime.module';
import { EventFabricModule } from '../event-fabric/event-fabric.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    UsageModule,
    IdentityModule,
    PrismaModule,
    PolicyRuntimeModule,
    EventFabricModule,
    ApiKeysModule,
  ],
  controllers: [PolicyFabricController],
  providers: [PolicyFabricService, FabricPolicyGate, TranslateAuthGuard],
  exports: [PolicyFabricService, FabricPolicyGate],
})
export class PolicyFabricModule {}
