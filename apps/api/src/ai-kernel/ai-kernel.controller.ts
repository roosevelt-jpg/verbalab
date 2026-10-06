import { Controller, Get, UseGuards } from '@nestjs/common';
import { AiKernelService } from './ai-kernel.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/ai-kernel')
export class AiKernelController {
  constructor(private readonly kernel: AiKernelService) {}

  @Get('products')
  products {
    return this.kernel.products;
  }

  @Get('engine')
  engine {
    return this.kernel.products;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.kernel.overview(session);
  }

  @Get('monitoring')
  monitoring {
    return this.kernel.monitoring;
  }
}
