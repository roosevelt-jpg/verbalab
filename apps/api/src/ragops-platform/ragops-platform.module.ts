import { Module } from '@nestjs/common';
import { RagopsPlatformController } from './ragops-platform.controller';
import { RagopsPlatformService } from './ragops-platform.service';

@Module({
  controllers: [RagopsPlatformController],
  providers: [RagopsPlatformService],
  exports: [RagopsPlatformService],
})
export class RagopsPlatformModule {}
