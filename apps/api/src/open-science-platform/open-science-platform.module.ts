import { Module } from '@nestjs/common';
import { OpenSciencePlatformController } from './open-science-platform.controller';
import { OpenSciencePlatformService } from './open-science-platform.service';

@Module({
  controllers: [OpenSciencePlatformController],
  providers: [OpenSciencePlatformService],
  exports: [OpenSciencePlatformService],
})
export class OpenSciencePlatformModule {}
