import { Module } from '@nestjs/common';
import { FinopsPlatformController } from './finops-platform.controller';
import { FinopsPlatformService } from './finops-platform.service';

@Module({
  controllers: [FinopsPlatformController],
  providers: [FinopsPlatformService],
  exports: [FinopsPlatformService],
})
export class FinopsPlatformModule {}
