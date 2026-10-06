import { Controller, Get, UseGuards } from '@nestjs/common';
import { KnowledgeCloudService } from './knowledge-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/knowledge-cloud')
export class KnowledgeCloudController {
  constructor(private readonly knowledgeCloud: KnowledgeCloudService) {}

  @Get('products')
  products {
    return this.knowledgeCloud.products;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.knowledgeCloud.overview(session);
  }
}
