import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AudioModule } from '../audio/audio.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { DocumentsModule } from '../documents/documents.module';
import { IdentityModule } from '../identity/identity.module';
import { PronunciationIntelligenceModule } from '../pronunciation-intelligence/pronunciation-intelligence.module';
import { TranslateModule } from '../translate/translate.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { LearnBackAdapters } from './learnback.adapters';
import { LearnBackController } from './learnback.controller';
import { LearnBackService } from './learnback.service';

@Module({
  imports: [
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    BillingModule,
    TranslateModule,
    AudioModule,
    DocumentsModule,
    PronunciationIntelligenceModule,
  ],
  controllers: [LearnBackController],
  providers: [LearnBackService, LearnBackAdapters, TranslateAuthGuard],
  exports: [LearnBackService],
})
export class LearnBackModule {}
