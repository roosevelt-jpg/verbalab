import { Module } from '@nestjs/common';
import { GroundedController } from './grounded.controller';
import { GroundedService } from './grounded.service';
import { TranslateModule } from '../translate/translate.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [TranslateModule, ApiKeysModule, IdentityModule, AuditCoreModule, RateLimitModule],
  controllers: [GroundedController],
  providers: [GroundedService, TranslateAuthGuard],
  exports: [GroundedService],
})
export class GroundedModule {}
