import { Module } from '@nestjs/common';
import { AgentopsPlatformController } from './agentops-platform.controller';
import { AgentopsPlatformService } from './agentops-platform.service';

@Module({
  controllers: [AgentopsPlatformController],
  providers: [AgentopsPlatformService],
  exports: [AgentopsPlatformService],
})
export class AgentopsPlatformModule {}
