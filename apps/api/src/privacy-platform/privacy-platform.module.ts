import { Module } from '@nestjs/common';
import { PrivacyPlatformController } from './privacy-platform.controller';
import { PrivacyPlatformService } from './privacy-platform.service';

@Module({
  controllers: [PrivacyPlatformController],
  providers: [PrivacyPlatformService],
  exports: [PrivacyPlatformService],
})
export class PrivacyPlatformModule {}
