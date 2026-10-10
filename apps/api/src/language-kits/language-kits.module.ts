import { Module } from '@nestjs/common';
import { LanguageKitsController } from './language-kits.controller';
import { LanguageKitsService } from './language-kits.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [ApiKeysModule, IdentityModule, AuditCoreModule, RateLimitModule],
  controllers: [LanguageKitsController],
  providers: [LanguageKitsService, TranslateAuthGuard],
  exports: [LanguageKitsService],
})
export class LanguageKitsModule {}
