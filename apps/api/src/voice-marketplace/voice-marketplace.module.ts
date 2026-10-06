import { Module } from '@nestjs/common';
import { VoiceMarketplaceController } from './voice-marketplace.controller';
import { VoiceMarketplaceService } from './voice-marketplace.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule, BillingModule, ApiKeysModule],
  controllers: [VoiceMarketplaceController],
  providers: [VoiceMarketplaceService, TranslateAuthGuard],
  exports: [VoiceMarketplaceService],
})
export class VoiceMarketplaceModule {}
