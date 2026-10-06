import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [AuditCoreModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
