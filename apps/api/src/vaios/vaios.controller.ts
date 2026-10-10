import { Controller, Get, UseGuards } from '@nestjs/common';
import { VaiosService } from './vaios.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/vaios')
export class VaiosController {
  constructor(private readonly vaios: VaiosService) {}

  @Get('products')
  products() {
    return this.vaios.products();
  }

  @Get('engine')
  engine() {
    return this.vaios.products();
  }

  @Get('routing')
  routing() {
    return this.vaios.routing();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.vaios.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.vaios.monitoring();
  }
}
