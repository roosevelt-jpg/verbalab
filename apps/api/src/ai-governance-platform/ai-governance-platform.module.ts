import { Module } from '@nestjs/common';
import { AiGovernancePlatformController } from './ai-governance-platform.controller';
import { AiGovernancePlatformService } from './ai-governance-platform.service';

@Module({
  controllers: [AiGovernancePlatformController],
  providers: [AiGovernancePlatformService],
  exports: [AiGovernancePlatformService],
})
export class AiGovernancePlatformModule {}
