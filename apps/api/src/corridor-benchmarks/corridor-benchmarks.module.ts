import { Module } from '@nestjs/common';
import { CorridorBenchmarksController } from './corridor-benchmarks.controller';
import { CorridorBenchmarksService } from './corridor-benchmarks.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [ApiKeysModule, IdentityModule, AuditCoreModule, RateLimitModule],
  controllers: [CorridorBenchmarksController],
  providers: [CorridorBenchmarksService, TranslateAuthGuard],
  exports: [CorridorBenchmarksService],
})
export class CorridorBenchmarksModule {}
