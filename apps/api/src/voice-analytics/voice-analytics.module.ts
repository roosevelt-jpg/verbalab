import { Module } from '@nestjs/common';
import { VoiceAnalyticsController } from './voice-analytics.controller';
import { VoiceAnalyticsService } from './voice-analytics.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [IdentityModule, PrismaModule, ApiKeysModule],
  controllers: [VoiceAnalyticsController],
  providers: [VoiceAnalyticsService, TranslateAuthGuard],
  exports: [VoiceAnalyticsService],
})
export class VoiceAnalyticsModule {}
