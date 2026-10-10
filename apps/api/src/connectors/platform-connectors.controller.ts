import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { PlatformConnectorsService } from './platform-connectors.service';

@Controller('v1/connectors/platform')
export class PlatformConnectorsController {
  constructor(private readonly platform: PlatformConnectorsService) {}

  @Get()
  list(@Query('category') category?: string) {
    return this.platform.list(category);
  }

  @Get('engine')
  engine() {
    return this.platform.engine();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.platform.get(id);
  }

  @Post(':id/demo')
  @HttpCode(200)
  demo(
    @Param('id') id: string,
    @Body() body?: { text?: string; source?: string; target?: string },
  ) {
    return this.platform.demo(id, body);
  }
}
