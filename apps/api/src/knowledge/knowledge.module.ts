import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { DocumentsModule } from '../documents/documents.module';
import { PromptsModule } from '../prompts/prompts.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    UsageModule,
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    DocumentsModule,
    PromptsModule,
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, TranslateAuthGuard],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
