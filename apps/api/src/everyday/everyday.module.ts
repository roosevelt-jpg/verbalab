import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AudioModule } from '../audio/audio.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { DocumentsModule } from '../documents/documents.module';
import { GatewayModule } from '../gateway/gateway.module';
import { IdentityModule } from '../identity/identity.module';
import { TranslateModule } from '../translate/translate.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { EverydayAdapters } from './everyday.adapters';
import { EverydayController } from './everyday.controller';
import { EverydayService } from './everyday.service';

@Module({
  imports: [
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    BillingModule,
    GatewayModule,
    TranslateModule,
    AudioModule,
    DocumentsModule,
  ],
  controllers: [EverydayController],
  providers: [EverydayService, EverydayAdapters, TranslateAuthGuard],
  exports: [EverydayService],
})
export class EverydayModule {}
