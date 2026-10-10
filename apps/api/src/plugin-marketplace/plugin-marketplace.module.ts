import { Module } from '@nestjs/common';
import { PluginMarketplaceController } from './plugin-marketplace.controller';
import { PluginMarketplaceService } from './plugin-marketplace.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { PluginRuntimeModule } from '../plugin-runtime/plugin-runtime.module';
import { PolicyFabricModule } from '../policy-fabric/policy-fabric.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
    BillingModule,
    ApiKeysModule,
    PluginRuntimeModule,
    PolicyFabricModule,
  ],
  controllers: [PluginMarketplaceController],
  providers: [PluginMarketplaceService, TranslateAuthGuard],
  exports: [PluginMarketplaceService],
})
export class PluginMarketplaceModule {}
