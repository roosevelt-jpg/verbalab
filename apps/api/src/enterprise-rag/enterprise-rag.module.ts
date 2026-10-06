import { Module } from '@nestjs/common';
import { EnterpriseRagController } from './enterprise-rag.controller';
import { EnterpriseRagService } from './enterprise-rag.service';
import { EnterpriseSearchModule } from '../enterprise-search/enterprise-search.module';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { PromptsModule } from '../prompts/prompts.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    EnterpriseSearchModule,
    GatewayModule,
    UsageModule,
    PromptsModule,
    IdentityModule,
    PrismaModule,
    ApiKeysModule,
    AuditCoreModule,
  ],
  controllers: [EnterpriseRagController],
  providers: [EnterpriseRagService, TranslateAuthGuard],
  exports: [EnterpriseRagService],
})
export class EnterpriseRagModule {}
