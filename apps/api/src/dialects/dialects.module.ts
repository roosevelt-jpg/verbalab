import { Module } from '@nestjs/common';
import { DialectsController } from './dialects.controller';
import { DialectsService } from './dialects.service';
import { GatewayModule } from '../gateway/gateway.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { LanguagesModule } from '../languages/languages.module';
import { AccentsModule } from '../accents/accents.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    LanguagesModule,
    GatewayModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    RateLimitModule,
    AccentsModule,
  ],
  controllers: [DialectsController],
  providers: [DialectsService, TranslateAuthGuard],
  exports: [DialectsService],
})
export class DialectsModule {}
