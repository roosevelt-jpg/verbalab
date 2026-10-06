import { Module } from '@nestjs/common';
import { TranslateController } from './translate.controller';
import { TranslateService } from './translate.service';
import { TranslateFormatsService } from './formats/translate-formats.service';
import { GatewayModule } from '../gateway/gateway.module';
import { LanguagesModule } from '../languages/languages.module';
import { UsageModule } from '../usage/usage.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { GlossaryModule } from '../glossary/glossary.module';
import { TmModule } from '../tm/tm.module';
import { QualityModule } from '../quality/quality.module';
import { ObservabilityModule } from '../observability/observability.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LocalesModule } from '../locales/locales.module';

@Module({
  imports: [
    GatewayModule,
    LanguagesModule,
    LocalesModule,
    UsageModule,
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    BillingModule,
    GlossaryModule,
    TmModule,
    QualityModule,
    ObservabilityModule,
    RateLimitModule,
    NotificationsModule,
  ],
  controllers: [TranslateController],
  providers: [TranslateService, TranslateFormatsService, TranslateAuthGuard],
  exports: [TranslateService, TranslateFormatsService],
})
export class TranslateModule {}
