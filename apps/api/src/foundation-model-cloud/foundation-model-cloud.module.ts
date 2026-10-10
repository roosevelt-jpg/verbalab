import { Module } from '@nestjs/common';
import { FoundationModelCloudController } from './foundation-model-cloud.controller';
import { FoundationModelCloudService } from './foundation-model-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [FoundationModelCloudController],
  providers: [FoundationModelCloudService],
  exports: [FoundationModelCloudService],
})
export class FoundationModelCloudModule {}
