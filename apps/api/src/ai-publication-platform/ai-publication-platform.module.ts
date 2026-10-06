import { Module } from '@nestjs/common';
import { AiPublicationPlatformController } from './ai-publication-platform.controller';
import { AiPublicationPlatformService } from './ai-publication-platform.service';

@Module({
  controllers: [AiPublicationPlatformController],
  providers: [AiPublicationPlatformService],
  exports: [AiPublicationPlatformService],
})
export class AiPublicationPlatformModule {}
