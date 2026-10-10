import { Module } from '@nestjs/common';
import { MixController } from './mix.controller';
import { MixService } from './mix.service';
import { AudioModule } from '../audio/audio.module';
import { TranslateModule } from '../translate/translate.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    AudioModule,
    TranslateModule,
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    RateLimitModule,
  ],
  controllers: [MixController],
  providers: [MixService, TranslateAuthGuard],
  exports: [MixService],
})
export class MixModule {}
