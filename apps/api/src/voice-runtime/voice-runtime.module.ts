import { Module } from '@nestjs/common';
import { VoiceRuntimeController } from './voice-runtime.controller';
import { VoiceRuntimeService } from './voice-runtime.service';
import { VoiceCloudModule } from '../voice-cloud/voice-cloud.module';

@Module({
  imports: [VoiceCloudModule],
  controllers: [VoiceRuntimeController],
  providers: [VoiceRuntimeService],
  exports: [VoiceRuntimeService],
})
export class VoiceRuntimeModule {}
