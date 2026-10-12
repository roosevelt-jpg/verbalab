import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PlatformConnectorsService, ConnectPlatformBody } from './platform-connectors.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

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

  @Get('connections')
  @UseGuards(ClerkAuthGuard)
  connections(@CurrentSession() session: SessionContext) {
    return this.platform.listConnections(session.organizationId, session.workspaceId);
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

  @Post(':id/connect')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(200)
  connect(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: ConnectPlatformBody,
  ) {
    return this.platform.connect({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      connectorId: id,
      body: body ?? {},
      ip: clientIp(req),
    });
  }

  @Post(':id/reverify')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(200)
  reverify(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.platform.reverify({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      connectorId: id,
      ip: clientIp(req),
    });
  }

  @Delete(':id/connection')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(200)
  disconnect(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.platform.disconnect({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      connectorId: id,
      ip: clientIp(req),
    });
  }
}
