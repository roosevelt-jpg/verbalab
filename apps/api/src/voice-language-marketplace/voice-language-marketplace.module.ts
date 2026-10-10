import { Module } from '@nestjs/common';
import { VoiceLanguageMarketplaceController } from './voice-language-marketplace.controller';
import { VoiceLanguageMarketplaceService } from './voice-language-marketplace.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { PolicyFabricModule } from '../policy-fabric/policy-fabric.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
    BillingModule,
    ApiKeysModule,
    PolicyFabricModule,
  ],
  controllers: [VoiceLanguageMarketplaceController],
  providers: [VoiceLanguageMarketplaceService, TranslateAuthGuard],
  exports: [VoiceLanguageMarketplaceService],
})
export class VoiceLanguageMarketplaceModule {}
