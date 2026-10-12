import { Module } from '@nestjs/common';
import { GatewayModule } from '../gateway/gateway.module';
import { NativeSpeechEngineModule } from '../native-speech-engine/nse.module';
import { DemoSpeechController } from './demo-speech.controller';

@Module({
  imports: [GatewayModule, NativeSpeechEngineModule],
  controllers: [DemoSpeechController],
})
export class DemoSpeechModule {}
