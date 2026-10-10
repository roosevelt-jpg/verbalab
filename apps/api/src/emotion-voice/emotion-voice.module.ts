import { Module } from '@nestjs/common';
import { EmotionVoiceController } from './emotion-voice.controller';
import { EmotionVoiceService } from './emotion-voice.service';
import { AudioModule } from '../audio/audio.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { UsageModule } from '../usage/usage.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [AudioModule, AuditCoreModule, UsageModule, ApiKeysModule, IdentityModule],
  controllers: [EmotionVoiceController],
  providers: [EmotionVoiceService, TranslateAuthGuard],
  exports: [EmotionVoiceService],
})
export class EmotionVoiceModule {}
