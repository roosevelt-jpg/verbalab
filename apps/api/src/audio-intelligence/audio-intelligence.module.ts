import { Module } from '@nestjs/common';
import { AudioIntelligenceController } from './audio-intelligence.controller';
import { AudioIntelligenceService } from './audio-intelligence.service';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AudioModule } from '../audio/audio.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [AuditCoreModule, ApiKeysModule, IdentityModule, AudioModule, RateLimitModule],
  controllers: [AudioIntelligenceController],
  providers: [AudioIntelligenceService, TranslateAuthGuard],
  exports: [AudioIntelligenceService],
})
export class AudioIntelligenceModule {}
