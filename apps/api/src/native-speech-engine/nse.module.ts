import { Module } from '@nestjs/common';
import { GatewayModule } from '../gateway/gateway.module';
import { IdentityModule } from '../identity/identity.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { LanguagePassportModule } from '../language-passport/passport.module';
import { SpeechReviewModule } from '../speech-review/speech-review.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { NativeSpeechEngineController } from './nse.controller';
import { NativeSpeechEngineService } from './nse.service';

@Module({
  imports: [
    GatewayModule,
    IdentityModule,
    ApiKeysModule,
    AuditCoreModule,
    LanguagePassportModule,
    SpeechReviewModule,
  ],
  controllers: [NativeSpeechEngineController],
  providers: [NativeSpeechEngineService, TranslateAuthGuard],
  exports: [NativeSpeechEngineService],
})
export class NativeSpeechEngineModule {}
