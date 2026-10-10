import { Module } from '@nestjs/common';
import { ExplainabilityPlatformController } from './explainability-platform.controller';
import { ExplainabilityPlatformService } from './explainability-platform.service';

@Module({
  controllers: [ExplainabilityPlatformController],
  providers: [ExplainabilityPlatformService],
  exports: [ExplainabilityPlatformService],
})
export class ExplainabilityPlatformModule {}
