import { Module } from '@nestjs/common';
import { AlignController } from './align.controller';
import { AlignService } from './align.service';
import { UsageModule } from '../usage/usage.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { BillingModule } from '../billing/billing.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [UsageModule, AuditCoreModule, ApiKeysModule, IdentityModule, BillingModule],
  controllers: [AlignController],
  providers: [AlignService, TranslateAuthGuard],
  exports: [AlignService],
})
export class AlignModule {}
