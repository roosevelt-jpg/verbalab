import { Module } from '@nestjs/common';
import { DataPlaneCloudController } from './data-plane-cloud.controller';
import { DataPlaneCloudService } from './data-plane-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [DataPlaneCloudController],
  providers: [DataPlaneCloudService],
  exports: [DataPlaneCloudService],
})
export class DataPlaneCloudModule {}
