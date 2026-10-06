import { Module } from '@nestjs/common';
import { CloudFoundationController } from './cloud-foundation.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { CloudOverviewService } from './cloud-overview.service';
import { IdentityModule } from '../identity/identity.module';
import { BillingModule } from '../billing/billing.module';
import { RegionsModule } from '../regions/regions.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [IdentityModule, BillingModule, RegionsModule, WorkspacesModule],
  controllers: [CloudFoundationController],
  providers: [FeatureFlagsService, CloudOverviewService],
  exports: [FeatureFlagsService, CloudOverviewService],
})
export class CloudFoundationModule {}
