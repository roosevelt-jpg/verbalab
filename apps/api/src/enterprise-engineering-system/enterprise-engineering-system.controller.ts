import { Controller, Get, UseGuards } from '@nestjs/common';
import { EnterpriseEngineeringSystemService } from './enterprise-engineering-system.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/enterprise-engineering-system')
export class EnterpriseEngineeringSystemController {
  constructor(private readonly ees: EnterpriseEngineeringSystemService) {}

  @Get('products')
  products {
    return this.ees.products;
  }

  @Get('engine')
  engine {
    return this.ees.products;
  }

  @Get('routing')
  routing {
    return this.ees.routing;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.ees.overview(session);
  }

  @Get('monitoring')
  monitoring {
    return this.ees.monitoring;
  }
}
