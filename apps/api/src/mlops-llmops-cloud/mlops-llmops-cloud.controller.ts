import { Controller, Get, UseGuards } from '@nestjs/common';
import { MlopsLlmopsCloudService } from './mlops-llmops-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/mlops-llmops-cloud')
export class MlopsLlmopsCloudController {
  constructor(private readonly mlops: MlopsLlmopsCloudService) {}

  @Get('products')
  products {
    return this.mlops.products;
  }

  @Get('engine')
  engine {
    return this.mlops.products;
  }

  @Get('routing')
  routing {
    return this.mlops.routing;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.mlops.overview(session);
  }

  @Get('monitoring')
  monitoring {
    return this.mlops.monitoring;
  }
}
