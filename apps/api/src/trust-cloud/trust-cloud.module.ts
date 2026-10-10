import { Module } from '@nestjs/common';
import { TrustCloudController } from './trust-cloud.controller';
import { TrustCloudService } from './trust-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [TrustCloudController],
  providers: [TrustCloudService],
  exports: [TrustCloudService],
})
export class TrustCloudModule {}
