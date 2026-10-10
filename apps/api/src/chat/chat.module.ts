import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateModule } from '../translate/translate.module';
import { PromptsModule } from '../prompts/prompts.module';
import { BillingModule } from '../billing/billing.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    UsageModule,
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    TranslateModule,
    PromptsModule,
    BillingModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, TranslateAuthGuard],
  exports: [ChatService],
})
export class ChatModule {}
