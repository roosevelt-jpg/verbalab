import { Module } from '@nestjs/common';
import { GitopsPlatformController } from './gitops-platform.controller';
import { GitopsPlatformService } from './gitops-platform.service';

@Module({
  controllers: [GitopsPlatformController],
  providers: [GitopsPlatformService],
  exports: [GitopsPlatformService],
})
export class GitopsPlatformModule {}
