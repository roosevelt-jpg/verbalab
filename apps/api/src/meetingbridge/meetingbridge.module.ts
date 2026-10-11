import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { DealBridgeModule } from '../dealbridge/dealbridge.module';
import { IdentityModule } from '../identity/identity.module';
import { TranslateModule } from '../translate/translate.module';
import { VoiceBridgeModule } from '../voicebridge/voicebridge.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { MeetingBridgeAdapters } from './meetingbridge.adapters';
import { MeetingBridgeController } from './meetingbridge.controller';
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
  ],
  controllers: [MeetingBridgeController],
  providers: [MeetingBridgeService, MeetingBridgeAdapters, TranslateAuthGuard],
  exports: [MeetingBridgeService],
})
export class MeetingBridgeModule {}
