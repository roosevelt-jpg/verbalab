import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GlobalDeploymentControllerService } from './global-deployment-controller.service';

@Controller('v1/global-deployment-controller')
export class GlobalDeploymentControllerController {
  constructor(private readonly service: GlobalDeploymentControllerService) {}

  @Get('engine')
  engine {
    return this.service.engine;
  }

  @Get('products')
  products {
    return this.service.engine;
  }

  @Get('monitoring')
  monitoring {
    return this.service.monitoring;
  }

  @Get('deployments')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('rollback')
  rollback(@Query('deploymentId') deploymentId?: string) {
    return this.service.rollback(deploymentId);
  }

  @Post('promote')
  promote(
    @Body
    body: {
      deploymentId: string;
      environment: string;
      authorized?: boolean;
      authorizationToken?: string;
    },
  ) {
    return this.service.promote(body);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
