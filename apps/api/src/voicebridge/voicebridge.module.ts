import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AudioModule } from '../audio/audio.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { DocumentsModule } from '../documents/documents.module';
import { IdentityModule } from '../identity/identity.module';
import { TranslateModule } from '../translate/translate.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { DealBridgeModule } from '../dealbridge/dealbridge.module';
import { VoiceBridgeAdapters } from './voicebridge.adapters';
import { VoiceBridgeController } from './voicebridge.controller';
import { VoiceBridgeService } from './voicebridge.service';

@Module({
  imports: [
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    BillingModule,
    DocumentsModule,
    AudioModule,
    TranslateModule,
    DealBridgeModule,
  ],
  controllers: [VoiceBridgeController],
  providers: [VoiceBridgeService, VoiceBridgeAdapters, TranslateAuthGuard],
  exports: [VoiceBridgeService],
})
export class VoiceBridgeModule {}
