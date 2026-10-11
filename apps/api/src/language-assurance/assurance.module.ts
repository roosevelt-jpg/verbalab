import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AudioModule } from '../audio/audio.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { FidelityModule } from '../fidelity/fidelity.module';
import { IdentityModule } from '../identity/identity.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { LanguageAssuranceAdapters } from './assurance.adapters';
import { LanguageAssuranceController } from './assurance.controller';
import { LanguageAssuranceService } from './assurance.service';

@Module({
  imports: [
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    BillingModule,
    FidelityModule,
    AudioModule,
  ],
  controllers: [LanguageAssuranceController],
  providers: [LanguageAssuranceService, LanguageAssuranceAdapters, TranslateAuthGuard],
  exports: [LanguageAssuranceService],
})
export class LanguageAssuranceModule {}
