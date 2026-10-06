import { Controller, Get, UseGuards } from '@nestjs/common';
import { LanguageCloudService } from './language-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/language')
export class LanguageCloudController {
  constructor(private readonly languageCloud: LanguageCloudService) {}

  @Get('products')
  products {
    return this.languageCloud.products;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.languageCloud.overview(session);
  }
}
