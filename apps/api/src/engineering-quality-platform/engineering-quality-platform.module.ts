import { Module } from '@nestjs/common';
import { EngineeringQualityPlatformController } from './engineering-quality-platform.controller';
import { EngineeringQualityPlatformService } from './engineering-quality-platform.service';
import { SupplyChainSecurityModule } from '../supply-chain-security/supply-chain-security.module';
import { ReliabilityEngineeringModule } from '../reliability-engineering/reliability-engineering.module';
import { DeveloperExperiencePlatformModule } from '../developer-experience-platform/developer-experience-platform.module';

@Module({
  imports: [SupplyChainSecurityModule, ReliabilityEngineeringModule, DeveloperExperiencePlatformModule],
  controllers: [EngineeringQualityPlatformController],
  providers: [EngineeringQualityPlatformService],
  exports: [EngineeringQualityPlatformService],
})
export class EngineeringQualityPlatformModule {}
