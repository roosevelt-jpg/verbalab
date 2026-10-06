import { Module } from '@nestjs/common';
import { GlobalConfigurationPlatformController } from './global-configuration-platform.controller';
import { GlobalConfigurationPlatformService } from './global-configuration-platform.service';

@Module({
  controllers: [GlobalConfigurationPlatformController],
  providers: [GlobalConfigurationPlatformService],
  exports: [GlobalConfigurationPlatformService],
})
export class GlobalConfigurationPlatformModule {}
