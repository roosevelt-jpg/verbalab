import { Module } from '@nestjs/common';
import { DataAdvantageController } from './data-advantage.controller';
import { DataAdvantageService } from './data-advantage.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [ApiKeysModule, IdentityModule, AuditCoreModule, RateLimitModule],
  controllers: [DataAdvantageController],
  providers: [DataAdvantageService, TranslateAuthGuard],
  exports: [DataAdvantageService],
})
export class DataAdvantageModule {}
