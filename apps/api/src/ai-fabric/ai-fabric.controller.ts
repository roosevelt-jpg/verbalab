import { Controller, Get, UseGuards } from '@nestjs/common';
import { AiFabricService } from './ai-fabric.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/ai-fabric')
export class AiFabricController {
  constructor(private readonly fabric: AiFabricService) {}

  @Get('products')
  products() {
    return this.fabric.products();
  }

  @Get('engine')
  engine() {
    return this.fabric.products();
  }

  @Get('routing')
  routing() {
    return this.fabric.routing();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.fabric.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.fabric.monitoring();
  }
}
