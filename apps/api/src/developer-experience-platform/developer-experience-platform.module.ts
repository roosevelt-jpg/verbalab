import { Module } from '@nestjs/common';
import { DeveloperExperiencePlatformController } from './developer-experience-platform.controller';
import { DeveloperExperiencePlatformService } from './developer-experience-platform.service';

@Module({
  controllers: [DeveloperExperiencePlatformController],
  providers: [DeveloperExperiencePlatformService],
  exports: [DeveloperExperiencePlatformService],
})
export class DeveloperExperiencePlatformModule {}
