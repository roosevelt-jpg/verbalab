import { Module } from '@nestjs/common';
import { ArchitectureGovernanceController } from './architecture-governance.controller';
import { ArchitectureGovernanceService } from './architecture-governance.service';
import { PlatformEngineeringCloudModule } from '../platform-engineering-cloud/platform-engineering-cloud.module';
import { DeveloperExperiencePlatformModule } from '../developer-experience-platform/developer-experience-platform.module';

@Module({
  imports: [PlatformEngineeringCloudModule, DeveloperExperiencePlatformModule],
  controllers: [ArchitectureGovernanceController],
  providers: [ArchitectureGovernanceService],
  exports: [ArchitectureGovernanceService],
})
export class ArchitectureGovernanceModule {}
