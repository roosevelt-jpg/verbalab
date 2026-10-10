import { Module } from '@nestjs/common';
import { EnterpriseCloudController } from './enterprise-cloud.controller';
import { EnterpriseCloudService } from './enterprise-cloud.service';
import { IdentityModule } from '../identity/identity.module';
import { BillingModule } from '../billing/billing.module';
import { RegionsModule } from '../regions/regions.module';
import { CloudFoundationModule } from '../cloud-foundation/cloud-foundation.module';

@Module({
  imports: [IdentityModule, BillingModule, RegionsModule, CloudFoundationModule],
  controllers: [EnterpriseCloudController],
  providers: [EnterpriseCloudService],
  exports: [EnterpriseCloudService],
})
export class EnterpriseCloudModule {}
