import { Module } from '@nestjs/common';
import { CompliancePlatformController } from './compliance-platform.controller';
import { CompliancePlatformService } from './compliance-platform.service';

@Module({
  controllers: [CompliancePlatformController],
  providers: [CompliancePlatformService],
  exports: [CompliancePlatformService],
})
export class CompliancePlatformModule {}
