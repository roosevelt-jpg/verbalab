import { Module } from '@nestjs/common';
import { SpeechRecognitionController } from './speech-recognition.controller';
import { SpeechRecognitionService } from './speech-recognition.service';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AudioModule } from '../audio/audio.module';
import { BillingModule } from '../billing/billing.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    UsageModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    AudioModule,
    BillingModule,
  ],
  controllers: [SpeechRecognitionController],
  providers: [SpeechRecognitionService, TranslateAuthGuard],
  exports: [SpeechRecognitionService],
})
export class SpeechRecognitionModule {}
