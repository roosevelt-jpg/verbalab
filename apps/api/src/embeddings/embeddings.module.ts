import { Module } from '@nestjs/common';
import { EmbeddingsController } from './embeddings.controller';
import { EmbeddingsService } from './embeddings.service';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [GatewayModule, UsageModule, ApiKeysModule, IdentityModule, AuditCoreModule],
  controllers: [EmbeddingsController],
  providers: [EmbeddingsService, TranslateAuthGuard],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
