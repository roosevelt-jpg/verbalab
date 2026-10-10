import { Module } from '@nestjs/common';
import { WakeWordController } from './wake-word.controller';
import { WakeWordService } from './wake-word.service';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AudioModule } from '../audio/audio.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    UsageModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    AudioModule,
    RateLimitModule,
  ],
  controllers: [WakeWordController],
  providers: [WakeWordService, TranslateAuthGuard],
  exports: [WakeWordService],
})
export class WakeWordModule {}
