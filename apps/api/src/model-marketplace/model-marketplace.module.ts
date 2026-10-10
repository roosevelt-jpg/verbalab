import { Module } from '@nestjs/common';
import { ModelMarketplaceController } from './model-marketplace.controller';
import { ModelMarketplaceService } from './model-marketplace.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ModelRegistryModule } from '../model-registry/model-registry.module';
import { PolicyFabricModule } from '../policy-fabric/policy-fabric.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
    BillingModule,
    ApiKeysModule,
    ModelRegistryModule,
    PolicyFabricModule,
  ],
  controllers: [ModelMarketplaceController],
  providers: [ModelMarketplaceService, TranslateAuthGuard],
  exports: [ModelMarketplaceService],
})
export class ModelMarketplaceModule {}
