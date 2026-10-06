import { Controller, Get, UseGuards } from '@nestjs/common';
import { VoiceCloudService } from './voice-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/voice-cloud')
export class VoiceCloudController {
  constructor(private readonly voiceCloud: VoiceCloudService) {}

  @Get('products')
  products {
    return this.voiceCloud.products;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.voiceCloud.overview(session);
  }
}
