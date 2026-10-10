import { Module } from '@nestjs/common';
import { PatentInnovationPlatformController } from './patent-innovation-platform.controller';
import { PatentInnovationPlatformService } from './patent-innovation-platform.service';

@Module({
  controllers: [PatentInnovationPlatformController],
  providers: [PatentInnovationPlatformService],
  exports: [PatentInnovationPlatformService],
})
export class PatentInnovationPlatformModule {}
