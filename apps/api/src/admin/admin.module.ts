import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { UsageModule } from '../usage/usage.module';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';

@Module({
  imports: [IdentityModule, AuditCoreModule, ApiKeysModule, UsageModule],
  controllers: [AdminController],
  providers: [AdminService, PlatformAdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
