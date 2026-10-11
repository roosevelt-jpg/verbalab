import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { IdentityModule } from '../identity/identity.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { RelayAdapters } from './relay.adapters';
import { RelayController } from './relay.controller';
import { RelayService } from './relay.service';

@Module({
  imports: [ApiKeysModule, IdentityModule, AuditCoreModule, BillingModule],
  controllers: [RelayController],
  providers: [RelayService, RelayAdapters, TranslateAuthGuard],
  exports: [RelayService],
})
export class RelayModule {}
