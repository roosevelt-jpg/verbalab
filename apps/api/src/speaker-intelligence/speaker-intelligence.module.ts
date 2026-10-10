import { Module } from '@nestjs/common';
import { SpeakerIntelligenceController } from './speaker-intelligence.controller';
import { SpeakerIntelligenceService } from './speaker-intelligence.service';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AudioModule } from '../audio/audio.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    UsageModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    AudioModule,
  ],
  controllers: [SpeakerIntelligenceController],
  providers: [SpeakerIntelligenceService, TranslateAuthGuard],
  exports: [SpeakerIntelligenceService],
})
export class SpeakerIntelligenceModule {}
