import { Controller, Get, Query } from '@nestjs/common';
import { AgentopsPlatformService } from './agentops-platform.service';

@Controller('v1/agentops-platform')
export class AgentopsPlatformController {
  constructor(private readonly service: AgentopsPlatformService) {}

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

  @Get('agents')
  agents(@Query('q') q?: string) {
    return this.service.agents(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
