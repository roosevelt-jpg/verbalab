import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AudioModule } from '../audio/audio.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { DocumentsModule } from '../documents/documents.module';
import { IdentityModule } from '../identity/identity.module';
import { TranslateModule } from '../translate/translate.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { DealBridgeAdapters } from './dealbridge.adapters';
import { DealBridgeAdminController } from './dealbridge.admin.controller';
import { DealBridgeController } from './dealbridge.controller';
import { DealBridgeService } from './dealbridge.service';

@Module({
  imports: [
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    BillingModule,
    DocumentsModule,
    AudioModule,
    TranslateModule,
  ],
  controllers: [DealBridgeController, DealBridgeAdminController],
  providers: [DealBridgeService, DealBridgeAdapters, TranslateAuthGuard],
  exports: [DealBridgeService],
})
export class DealBridgeModule {}
