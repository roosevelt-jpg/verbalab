import { Module } from '@nestjs/common';
import { WorkflowMarketplaceController } from './workflow-marketplace.controller';
import { WorkflowMarketplaceService } from './workflow-marketplace.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { WorkflowRuntimeModule } from '../workflow-runtime/workflow-runtime.module';
import { PolicyFabricModule } from '../policy-fabric/policy-fabric.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
    BillingModule,
    ApiKeysModule,
    WorkflowRuntimeModule,
    PolicyFabricModule,
  ],
  controllers: [WorkflowMarketplaceController],
  providers: [WorkflowMarketplaceService, TranslateAuthGuard],
  exports: [WorkflowMarketplaceService],
})
export class WorkflowMarketplaceModule {}
