import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { MemoryFabricService } from './memory-fabric.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/memory-fabric')
export class MemoryFabricController {
  constructor(private readonly fabric: MemoryFabricService) {}

  @Get('products')
  products() {
    return this.fabric.products();
  }

  @Get('engine')
  engine() {
    return this.fabric.products();
  }

  @Get('routes')
  routes() {
    return this.fabric.routes();
  }

  @Post('route')
  @HttpCode(HttpStatus.OK)
  route(@Body() body: { kinds?: string[] }) {
    return this.fabric.route({ kinds: body.kinds });
  }

  @Post('pipeline')
  @HttpCode(HttpStatus.OK)
  pipeline(@Body() body: { pipelineId?: string; steps?: string[] }) {
    return this.fabric.pipeline(body);
  }

  @Get('versions')
  versions() {
    return this.fabric.versions();
  }

  @Get('cache')
  cache() {
    return this.fabric.cacheHandoff();
  }

  @Post('federate')
  @HttpCode(HttpStatus.OK)
  federate(@Body() body: { kinds?: string[] }) {
    return this.fabric.federate({ kinds: body.kinds });
  }

  @Post('sync')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  sync(@Req() req: AuthedReq) {
    return this.fabric.sync({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Get('memories')
  @UseGuards(TranslateAuthGuard)
  memories(
    @Req() req: AuthedReq,
    @Query('scope') scope?: string,
    @Query('kind') kind?: string,
    @Query('limit') limit?: string,
  ) {
    return this.fabric.list({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      scope,
      kind,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('search')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  search(
    @Req() req: AuthedReq,
    @Body() body: { query?: string; scope?: string; kind?: string; limit?: number },
  ) {
    return this.fabric.search({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('replicate')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  replicate(
    @Req() req: AuthedReq,
    @Body() body: { targetWorkspaceIds?: string[] },
  ) {
    return this.fabric.replicate({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      targetWorkspaceIds: body.targetWorkspaceIds,
    });
  }

  @Post('distribute')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  distribute(
    @Req() req: AuthedReq,
    @Body()
    body: {
      kinds?: string[];
      targetWorkspaceIds?: string[];
      publishEvent?: boolean;
      topic?: string;
    },
  ) {
    return this.fabric.distribute({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      apiKeyId: req.translateAuth.apiKeyId,
      kinds: body.kinds,
      targetWorkspaceIds: body.targetWorkspaceIds,
      publishEvent: body.publishEvent,
      topic: body.topic,
    });
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
