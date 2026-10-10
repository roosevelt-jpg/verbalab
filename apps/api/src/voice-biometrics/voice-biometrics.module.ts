import { Module } from '@nestjs/common';
import { VoiceBiometricsController } from './voice-biometrics.controller';
import { VoiceBiometricsService } from './voice-biometrics.service';
import { SpeakerIntelligenceModule } from '../speaker-intelligence/speaker-intelligence.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AudioModule } from '../audio/audio.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    SpeakerIntelligenceModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    AudioModule,
    RateLimitModule,
  ],
  controllers: [VoiceBiometricsController],
  providers: [VoiceBiometricsService, TranslateAuthGuard],
  exports: [VoiceBiometricsService],
})
export class VoiceBiometricsModule {}
