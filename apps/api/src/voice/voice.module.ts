import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceAgentService } from './voice-agent.service';
import { TwilioTelephonyService } from './twilio.telephony';
import { VoiceAudioStore } from './voice-audio.store';
import { AudioModule } from '../audio/audio.module';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { PromptsModule } from '../prompts/prompts.module';

@Module({
  imports: [
    AudioModule,
    GatewayModule,
    UsageModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    PrismaModule,
    PromptsModule,
  ],
  controllers: [VoiceController],
  providers: [
    VoiceAgentService,
    TwilioTelephonyService,
    VoiceAudioStore,
    TranslateAuthGuard,
    ApiKeyGuard,
    ClerkAuthGuard,
  ],
  exports: [VoiceAgentService, TwilioTelephonyService],
})
export class VoiceModule {}
