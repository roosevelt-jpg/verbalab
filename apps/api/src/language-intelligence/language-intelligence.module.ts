import { Module } from '@nestjs/common';
import { LanguageIntelligenceController } from './language-intelligence.controller';
import { LanguageIntelligenceService } from './language-intelligence.service';
import { GatewayModule } from '../gateway/gateway.module';
import { DialectsModule } from '../dialects/dialects.module';
import { AccentsModule } from '../accents/accents.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    DialectsModule,
    AccentsModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    RateLimitModule,
  ],
  controllers: [LanguageIntelligenceController],
  providers: [LanguageIntelligenceService, TranslateAuthGuard],
  exports: [LanguageIntelligenceService],
})
export class LanguageIntelligenceModule {}
