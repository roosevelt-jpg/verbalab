import { Module } from '@nestjs/common';
import { SpeechAnalyticsController } from './speech-analytics.controller';
import { SpeechAnalyticsService } from './speech-analytics.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [ApiKeysModule, IdentityModule],
  controllers: [SpeechAnalyticsController],
  providers: [SpeechAnalyticsService, TranslateAuthGuard],
  exports: [SpeechAnalyticsService],
})
export class SpeechAnalyticsModule {}
