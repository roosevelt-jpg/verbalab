import { Module } from '@nestjs/common';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { IdentityModule } from '../identity/identity.module';
import { PilotRequestsAdminController, PilotRequestsController } from './pilot-requests.controller';
import { PilotRequestsService } from './pilot-requests.service';

@Module({
  imports: [IdentityModule],
  controllers: [PilotRequestsController, PilotRequestsAdminController],
  providers: [PilotRequestsService, PlatformAdminGuard],
})
export class PilotRequestsModule {}
