import { Module } from '@nestjs/common';
import { SpeechRuntimeController } from './speech-runtime.controller';
import { SpeechRuntimeService } from './speech-runtime.service';
import { SpeechCloudModule } from '../speech-cloud/speech-cloud.module';

@Module({
  imports: [SpeechCloudModule],
  controllers: [SpeechRuntimeController],
  providers: [SpeechRuntimeService],
  exports: [SpeechRuntimeService],
})
export class SpeechRuntimeModule {}
