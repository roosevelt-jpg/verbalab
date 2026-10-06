import { Module } from '@nestjs/common';
import { VoiceClonesController } from './voice-clones.controller';
import { VoiceClonesService } from './voice-clones.service';
import { BillingModule } from '../billing/billing.module';
import { IdentityModule } from '../identity/identity.module';
import { DocumentsModule } from '../documents/documents.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [BillingModule, IdentityModule, DocumentsModule, ApiKeysModule],
  controllers: [VoiceClonesController],
  providers: [VoiceClonesService, TranslateAuthGuard],
  exports: [VoiceClonesService],
})
export class VoiceClonesModule {}
