import { Module } from '@nestjs/common';
import { BenchmarkPlatformController } from './benchmark-platform.controller';
import { BenchmarkPlatformService } from './benchmark-platform.service';

@Module({
  controllers: [BenchmarkPlatformController],
  providers: [BenchmarkPlatformService],
  exports: [BenchmarkPlatformService],
})
export class BenchmarkPlatformModule {}
