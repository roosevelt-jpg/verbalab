import { Module } from '@nestjs/common';
import { ResearchCloudController } from './research-cloud.controller';
import { ResearchCloudService } from './research-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [ResearchCloudController],
  providers: [ResearchCloudService],
  exports: [ResearchCloudService],
})
export class ResearchCloudModule {}
