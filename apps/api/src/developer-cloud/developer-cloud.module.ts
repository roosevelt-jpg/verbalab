import { Module } from '@nestjs/common';
import { DeveloperCloudController } from './developer-cloud.controller';
import { DeveloperCloudService } from './developer-cloud.service';
import { IdentityModule } from '../identity/identity.module';
import { BillingModule } from '../billing/billing.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [IdentityModule, BillingModule, UsageModule],
  controllers: [DeveloperCloudController],
  providers: [DeveloperCloudService],
  exports: [DeveloperCloudService],
})
export class DeveloperCloudModule {}
