import { Module } from '@nestjs/common';
import { EngineeringGovernanceController } from './engineering-governance.controller';
import { EngineeringGovernanceService } from './engineering-governance.service';
import { AiGovernancePlatformModule } from '../ai-governance-platform/ai-governance-platform.module';
import { TrustCloudModule } from '../trust-cloud/trust-cloud.module';
import { ReleaseEngineeringModule } from '../release-engineering/release-engineering.module';
import { PlatformEngineeringCloudModule } from '../platform-engineering-cloud/platform-engineering-cloud.module';

@Module({
  imports: [AiGovernancePlatformModule, TrustCloudModule, ReleaseEngineeringModule, PlatformEngineeringCloudModule],
  controllers: [EngineeringGovernanceController],
  providers: [EngineeringGovernanceService],
  exports: [EngineeringGovernanceService],
})
export class EngineeringGovernanceModule {}
