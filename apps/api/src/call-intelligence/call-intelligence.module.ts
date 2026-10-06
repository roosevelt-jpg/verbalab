import { Module } from '@nestjs/common';
import { CallIntelligenceController } from './call-intelligence.controller';
import { CallIntelligenceService } from './call-intelligence.service';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AudioModule } from '../audio/audio.module';
import { DocumentsModule } from '../documents/documents.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    UsageModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    AudioModule,
    DocumentsModule,
    RateLimitModule,
  ],
  controllers: [CallIntelligenceController],
  providers: [CallIntelligenceService, TranslateAuthGuard],
  exports: [CallIntelligenceService],
})
export class CallIntelligenceModule {}
