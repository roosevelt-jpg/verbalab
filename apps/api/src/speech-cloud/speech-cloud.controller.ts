import { Controller, Get, UseGuards } from '@nestjs/common';
import { SpeechCloudService } from './speech-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/speech')
export class SpeechCloudController {
  constructor(private readonly speechCloud: SpeechCloudService) {}

  @Get('products')
  products() {
    return this.speechCloud.products();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.speechCloud.overview(session);
  }
}
