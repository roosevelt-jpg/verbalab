import { Module } from '@nestjs/common';
import { PromptopsPlatformController } from './promptops-platform.controller';
import { PromptopsPlatformService } from './promptops-platform.service';

@Module({
  controllers: [PromptopsPlatformController],
  providers: [PromptopsPlatformService],
  exports: [PromptopsPlatformService],
})
export class PromptopsPlatformModule {}
