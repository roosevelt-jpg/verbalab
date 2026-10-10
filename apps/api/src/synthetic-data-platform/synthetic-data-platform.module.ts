import { Module } from '@nestjs/common';
import { SyntheticDataPlatformController } from './synthetic-data-platform.controller';
import { SyntheticDataPlatformService } from './synthetic-data-platform.service';

@Module({
  controllers: [SyntheticDataPlatformController],
  providers: [SyntheticDataPlatformService],
  exports: [SyntheticDataPlatformService],
})
export class SyntheticDataPlatformModule {}
