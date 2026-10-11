import { Module } from '@nestjs/common';
import { SpeechEmbedController } from './speech-embed.controller';
import { SpeechEmbedService } from './speech-embed.service';
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
  controllers: [SpeechEmbedController],
  providers: [SpeechEmbedService, TranslateAuthGuard],
  exports: [SpeechEmbedService],
})
export class SpeechEmbedModule {}
