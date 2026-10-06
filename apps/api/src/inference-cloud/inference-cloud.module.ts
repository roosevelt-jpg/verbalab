import { Module } from '@nestjs/common';
import { InferenceCloudController } from './inference-cloud.controller';
import { InferenceCloudService } from './inference-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [InferenceCloudController],
  providers: [InferenceCloudService],
  exports: [InferenceCloudService],
})
export class InferenceCloudModule {}
