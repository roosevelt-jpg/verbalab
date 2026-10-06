import { Module, forwardRef } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { WebhookService } from './webhook.service';
import { TranslateModule } from '../translate/translate.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { DocumentsModule } from '../documents/documents.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [
    TranslateModule,
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    forwardRef(() => DocumentsModule),
    NotificationsModule,
    forwardRef(() => WorkflowsModule),
  ],
  controllers: [JobsController],
  providers: [JobsService, WebhookService],
  exports: [JobsService, WebhookService],
})
export class JobsModule {}
