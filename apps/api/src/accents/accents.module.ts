import { Module } from '@nestjs/common';
import { AccentsController } from './accents.controller';
import { AccentsService } from './accents.service';
import { AccentIdentityService } from './accent-identity.service';
import { GatewayModule } from '../gateway/gateway.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { LanguagesModule } from '../languages/languages.module';
import { UsageModule } from '../usage/usage.module';
import { AudioModule } from '../audio/audio.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    LanguagesModule,
    GatewayModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    RateLimitModule,
    UsageModule,
    AudioModule,
  ],
  controllers: [AccentsController],
  providers: [AccentsService, AccentIdentityService, TranslateAuthGuard],
  exports: [AccentsService, AccentIdentityService],
})
export class AccentsModule {}
