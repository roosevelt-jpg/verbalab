import { Module } from '@nestjs/common';
import { PlatformEngineeringCloudController } from './platform-engineering-cloud.controller';
import { PlatformEngineeringCloudService } from './platform-engineering-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [PlatformEngineeringCloudController],
  providers: [PlatformEngineeringCloudService],
  exports: [PlatformEngineeringCloudService],
})
export class PlatformEngineeringCloudModule {}
