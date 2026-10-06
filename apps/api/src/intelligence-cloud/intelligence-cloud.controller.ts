import { Controller, Get, UseGuards } from '@nestjs/common';
import { IntelligenceCloudService } from './intelligence-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/intelligence-cloud')
export class IntelligenceCloudController {
  constructor(private readonly intelligenceCloud: IntelligenceCloudService) {}

  @Get('products')
  products {
    return this.intelligenceCloud.products;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.intelligenceCloud.overview(session);
  }
}
