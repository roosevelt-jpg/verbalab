import { Module } from '@nestjs/common';
import { VoiceClonesController } from './voice-clones.controller';
import { VoiceClonesService } from './voice-clones.service';
import { BillingModule } from '../billing/billing.module';
import { IdentityModule } from '../identity/identity.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [BillingModule, IdentityModule, DocumentsModule],
  controllers: [VoiceClonesController],
  providers: [VoiceClonesService],
  exports: [VoiceClonesService],
})
export class VoiceClonesModule {}
