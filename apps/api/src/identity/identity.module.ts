import { Module } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { IdentityCloudService } from './identity-cloud.service';
import { IdentityCloudController } from './identity-cloud.controller';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [IdentityCloudController],
  providers: [IdentityService, IdentityCloudService, ClerkAuthGuard],
  exports: [IdentityService, IdentityCloudService, ClerkAuthGuard],
})
export class IdentityModule {}
