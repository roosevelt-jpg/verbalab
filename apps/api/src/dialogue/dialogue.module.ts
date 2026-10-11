import { Module } from '@nestjs/common';
import { DialogueController } from './dialogue.controller';
import { DialogueService } from './dialogue.service';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    UsageModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    BillingModule,
    PrismaModule,
  ],
  controllers: [DialogueController],
  providers: [DialogueService, TranslateAuthGuard],
  exports: [DialogueService],
})
export class DialogueModule {}
