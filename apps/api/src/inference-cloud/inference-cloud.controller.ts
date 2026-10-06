import { Controller, Get, UseGuards } from '@nestjs/common';
import { InferenceCloudService } from './inference-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/inference-cloud')
export class InferenceCloudController {
  constructor(private readonly inferenceCloud: InferenceCloudService) {}

  @Get('products')
  products {
    return this.inferenceCloud.products;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.inferenceCloud.overview(session);
  }
}
