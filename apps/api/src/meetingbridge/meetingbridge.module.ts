import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AudioModule } from '../audio/audio.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { DealBridgeModule } from '../dealbridge/dealbridge.module';
import { GatewayModule } from '../gateway/gateway.module';
import { IdentityModule } from '../identity/identity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TranslateModule } from '../translate/translate.module';
import { VoiceBridgeModule } from '../voicebridge/voicebridge.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { MeetingBridgeAdapters } from './meetingbridge.adapters';
import { MeetingBridgeController, MeetingBridgePublicController } from './meetingbridge.controller';
import { MeetingBridgeIntegrations } from './meetingbridge.integrations';
import { MeetingBridgeMediaService } from './meetingbridge.media';
import { MeetingBridgeService } from './meetingbridge.service';

@Module({
  imports: [
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    BillingModule,
    TranslateModule,
    DealBridgeModule,
    VoiceBridgeModule,
    AudioModule,
    GatewayModule,
    NotificationsModule,
  ],
  controllers: [MeetingBridgeController, MeetingBridgePublicController],
  providers: [
    MeetingBridgeService,
    MeetingBridgeAdapters,
    MeetingBridgeMediaService,
    MeetingBridgeIntegrations,
    TranslateAuthGuard,
  ],
  exports: [MeetingBridgeService],
})
export class MeetingBridgeModule {}
