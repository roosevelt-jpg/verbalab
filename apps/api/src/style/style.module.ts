import { Module } from '@nestjs/common';
import { StyleController } from './style.controller';
import { StyleService } from './style.service';
import { GatewayModule } from '../gateway/gateway.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { UsageModule } from '../usage/usage.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    RateLimitModule,
    UsageModule,
  ],
  controllers: [StyleController],
  providers: [StyleService, TranslateAuthGuard],
  exports: [StyleService],
})
export class StyleModule {}
