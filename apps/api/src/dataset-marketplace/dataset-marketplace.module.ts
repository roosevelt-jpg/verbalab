import { Module } from '@nestjs/common';
import { DatasetMarketplaceController } from './dataset-marketplace.controller';
import { DatasetMarketplaceService } from './dataset-marketplace.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { BillingModule } from '../billing/billing.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { DatasetsModule } from '../datasets/datasets.module';
import { PolicyFabricModule } from '../policy-fabric/policy-fabric.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
    BillingModule,
    ApiKeysModule,
    DatasetsModule,
    PolicyFabricModule,
  ],
  controllers: [DatasetMarketplaceController],
  providers: [DatasetMarketplaceService, TranslateAuthGuard],
  exports: [DatasetMarketplaceService],
})
export class DatasetMarketplaceModule {}
