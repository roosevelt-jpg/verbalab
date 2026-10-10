import { Module } from '@nestjs/common';
import { VoiceClonesModule } from '../voice-clones/voice-clones.module';
import { IdentityModule } from '../identity/identity.module';
import { LanguageIntegrityController } from './language-integrity.controller';
import { LanguageIntegrityService } from './language-integrity.service';

@Module({
  imports: [VoiceClonesModule, IdentityModule],
  controllers: [LanguageIntegrityController],
  providers: [LanguageIntegrityService],
  exports: [LanguageIntegrityService],
})
export class LanguageIntegrityModule {}
