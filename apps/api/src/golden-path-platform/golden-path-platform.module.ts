import { Module } from '@nestjs/common';
import { GoldenPathPlatformController } from './golden-path-platform.controller';
import { GoldenPathPlatformService } from './golden-path-platform.service';

@Module({
  controllers: [GoldenPathPlatformController],
  providers: [GoldenPathPlatformService],
  exports: [GoldenPathPlatformService],
})
export class GoldenPathPlatformModule {}
