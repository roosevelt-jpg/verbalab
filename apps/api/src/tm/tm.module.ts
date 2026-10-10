import { Module } from '@nestjs/common';
import { TmController, TmHubController } from './tm.controller';
import { TmService } from './tm.service';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { GatewayModule } from '../gateway/gateway.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [IdentityModule, AuditCoreModule, GatewayModule, ApiKeysModule, RateLimitModule],
  controllers: [TmHubController, TmController],
  providers: [TmService, TranslateAuthGuard],
  exports: [TmService],
})
export class TmModule {}
