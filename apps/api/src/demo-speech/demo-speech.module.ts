import { Module } from '@nestjs/common';
import { GatewayModule } from '../gateway/gateway.module';
import { DemoSpeechController } from './demo-speech.controller';

@Module({
  imports: [GatewayModule],
  controllers: [DemoSpeechController],
})
export class DemoSpeechModule {}
