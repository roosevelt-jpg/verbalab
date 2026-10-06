import { Module } from '@nestjs/common';
import { DataPlaneStreamingController } from './data-plane-streaming.controller';
import { DataPlaneStreamingService } from './data-plane-streaming.service';
import { StreamingRuntimeModule } from '../streaming-runtime/streaming-runtime.module';

@Module({
  imports: [StreamingRuntimeModule],
  controllers: [DataPlaneStreamingController],
  providers: [DataPlaneStreamingService],
  exports: [DataPlaneStreamingService],
})
export class DataPlaneStreamingModule {}
