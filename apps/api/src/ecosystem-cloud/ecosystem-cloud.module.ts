import { Module } from '@nestjs/common';
import { EcosystemCloudController } from './ecosystem-cloud.controller';
import { EcosystemCloudService } from './ecosystem-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [EcosystemCloudController],
  providers: [EcosystemCloudService],
  exports: [EcosystemCloudService],
})
export class EcosystemCloudModule {}
