import { Module } from '@nestjs/common';
import { AgentMarketplaceController } from './agent-marketplace.controller';
import { AgentMarketplaceService } from './agent-marketplace.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AgentRuntimeModule } from '../agent-runtime/agent-runtime.module';
import { PolicyFabricModule } from '../policy-fabric/policy-fabric.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
    BillingModule,
    ApiKeysModule,
    AgentRuntimeModule,
    PolicyFabricModule,
  ],
  controllers: [AgentMarketplaceController],
  providers: [AgentMarketplaceService, TranslateAuthGuard],
  exports: [AgentMarketplaceService],
})
export class AgentMarketplaceModule {}
