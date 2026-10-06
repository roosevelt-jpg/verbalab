import { Controller, Get, Query } from '@nestjs/common';
import { PromptopsPlatformService } from './promptops-platform.service';

@Controller('v1/promptops-platform')
export class PromptopsPlatformController {
  constructor(private readonly service: PromptopsPlatformService) {}

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

  @Get('prompts')
  prompts(@Query('q') q?: string) {
    return this.service.prompts(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
