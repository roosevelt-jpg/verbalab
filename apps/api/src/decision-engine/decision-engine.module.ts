import { Module } from '@nestjs/common';
import { DecisionEngineController } from './decision-engine.controller';
import { DecisionEngineService } from './decision-engine.service';
import { BillingModule } from '../billing/billing.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [BillingModule, IdentityModule, PrismaModule, ApiKeysModule, AuditCoreModule],
  controllers: [DecisionEngineController],
  providers: [DecisionEngineService, TranslateAuthGuard],
  exports: [DecisionEngineService],
})
export class DecisionEngineModule {}
