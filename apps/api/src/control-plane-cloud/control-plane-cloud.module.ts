import { Module } from '@nestjs/common';
import { ControlPlaneCloudController } from './control-plane-cloud.controller';
import { ControlPlaneCloudService } from './control-plane-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [ControlPlaneCloudController],
  providers: [ControlPlaneCloudService],
  exports: [ControlPlaneCloudService],
})
export class ControlPlaneCloudModule {}
