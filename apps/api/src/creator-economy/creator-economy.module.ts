import { Module } from '@nestjs/common';
import { CreatorEconomyController } from './creator-economy.controller';
import { CreatorEconomyService } from './creator-economy.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { PolicyFabricModule } from '../policy-fabric/policy-fabric.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
    BillingModule,
    ApiKeysModule,
    PolicyFabricModule,
  ],
  controllers: [CreatorEconomyController],
  providers: [CreatorEconomyService, TranslateAuthGuard],
  exports: [CreatorEconomyService],
})
export class CreatorEconomyModule {}
