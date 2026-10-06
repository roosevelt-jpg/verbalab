import { Module } from '@nestjs/common';
import { FidelityController } from './fidelity.controller';
import { FidelityService } from './fidelity.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [ApiKeysModule, IdentityModule, AuditCoreModule, RateLimitModule],
  controllers: [FidelityController],
  providers: [FidelityService, TranslateAuthGuard],
  exports: [FidelityService],
})
export class FidelityModule {}
