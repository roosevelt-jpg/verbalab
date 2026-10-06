import { Module } from '@nestjs/common';
import { ExperimentPlatformController } from './experiment-platform.controller';
import { ExperimentPlatformService } from './experiment-platform.service';

@Module({
  controllers: [ExperimentPlatformController],
  providers: [ExperimentPlatformService],
  exports: [ExperimentPlatformService],
})
export class ExperimentPlatformModule {}
