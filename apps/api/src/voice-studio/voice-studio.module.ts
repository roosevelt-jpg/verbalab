import { Module } from '@nestjs/common';
import { VoiceStudioController } from './voice-studio.controller';
import { VoiceStudioService } from './voice-studio.service';
import { AudioModule } from '../audio/audio.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { UsageModule } from '../usage/usage.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { NeuralTtsModule } from '../neural-tts/neural-tts.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    AudioModule,
    AuditCoreModule,
    UsageModule,
    ApiKeysModule,
    IdentityModule,
    NeuralTtsModule,
  ],
  controllers: [VoiceStudioController],
  providers: [VoiceStudioService, TranslateAuthGuard],
  exports: [VoiceStudioService],
})
export class VoiceStudioModule {}
