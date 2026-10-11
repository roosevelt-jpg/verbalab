import { Module } from '@nestjs/common';
import { VoiceDesignController } from './voice-design.controller';
import { VoiceDesignService } from './voice-design.service';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { BillingModule } from '../billing/billing.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    UsageModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    BillingModule,
  ],
  controllers: [VoiceDesignController],
  providers: [VoiceDesignService, TranslateAuthGuard],
  exports: [VoiceDesignService],
})
export class VoiceDesignModule {}
