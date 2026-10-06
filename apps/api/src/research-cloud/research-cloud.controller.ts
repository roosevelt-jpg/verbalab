import { Controller, Get, UseGuards } from '@nestjs/common';
import { ResearchCloudService } from './research-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/research-cloud')
export class ResearchCloudController {
  constructor(private readonly research: ResearchCloudService) {}

  @Get('products')
  products {
    return this.research.products;
  }

  @Get('engine')
  engine {
    return this.research.products;
  }

  @Get('routing')
  routing {
    return this.research.routing;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.research.overview(session);
  }

  @Get('monitoring')
  monitoring {
    return this.research.monitoring;
  }
}
