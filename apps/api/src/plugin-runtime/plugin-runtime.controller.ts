import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PluginRuntimeService } from './plugin-runtime.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/plugin-runtime')
export class PluginRuntimeController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get('engine')
  engine {
    return this.runtime.engine;
  }

  @Get('permissions')
  permissions {
    return this.runtime.permissions;
  }

  @Get('plugins')
  @UseGuards(TranslateAuthGuard)
  list(@Req req: AuthedReq) {
    return this.runtime.listPlugins({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('plugins/:id')
  @UseGuards(TranslateAuthGuard)
  get(@Req req: AuthedReq, @Param('id') id: string) {
    return this.runtime.getPlugin({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Post('plugins')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  register(
    @Req req: AuthedReq,
    @Body
    body: {
      name?: string;
      permissions?: string[];
      dependencies?: string[];
      description?: string;
    },
  ) {
    return this.runtime.register({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('plugins/:id/lifecycle')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  lifecycle(
    @Req req: AuthedReq,
    @Param('id') id: string,
    @Body body: { status?: string },
  ) {
    return this.runtime.lifecycle({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      status: body.status,
    });
  }

  @Post('plugins/:id/version')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  version(
    @Req req: AuthedReq,
    @Param('id') id: string,
    @Body body: { description?: string },
  ) {
    return this.runtime.version({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      description: body.description,
    });
  }

  @Post('invoke')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  invoke(
    @Req req: AuthedReq,
    @Body
    body: {
      pluginId?: string;
      actions?: Array<{ action: string; input?: Record<string, unknown> }>;
      payload?: Record<string, unknown>;
    },
  ) {
    return this.runtime.invoke({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Get('marketplace')
  @UseGuards(TranslateAuthGuard)
  marketplace(@Req req: AuthedReq) {
    return this.runtime.marketplace({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.runtime.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.runtime.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }
}
