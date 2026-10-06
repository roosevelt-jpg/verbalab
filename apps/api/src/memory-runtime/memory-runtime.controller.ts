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
import { MemoryRuntimeService } from './memory-runtime.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/memory-runtime')
export class MemoryRuntimeController {
  constructor(private readonly runtime: MemoryRuntimeService) {}

  @Get('engine')
  engine() {
    return this.runtime.engine();
  }

  @Get('scopes')
  scopes() {
    return this.runtime.scopes();
  }

  @Get('ceilings')
  ceilings() {
    return this.runtime.ceilings();
  }

  @Get('memories')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req() req: AuthedReq,
    @Query('scope') scope?: string,
    @Query('kind') kind?: string,
    @Query('limit') limit?: string,
  ) {
    return this.runtime.list({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      scope,
      kind,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('put')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  put(
    @Req() req: AuthedReq,
    @Body()
    body: {
      scope?: string;
      kind?: string;
      content?: string;
      key?: string;
      conversationId?: string;
      agentId?: string;
      subjectUserId?: string;
      ttlSec?: number;
      encrypt?: boolean;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.runtime.put({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('search')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  search(
    @Req() req: AuthedReq,
    @Body() body: { query?: string; scope?: string; kind?: string; limit?: number },
  ) {
    return this.runtime.search({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      ...body,
    });
  }

  @Post('revise')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  revise(@Req() req: AuthedReq, @Body() body: { id?: string; content?: string }) {
    return this.runtime.revise({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('compress')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  compress(@Req() req: AuthedReq, @Body() body: { id?: string; maxChars?: number }) {
    return this.runtime.compress({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('evict')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  evict(@Req() req: AuthedReq, @Body() body: { policy?: string }) {
    return this.runtime.evict({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('sync')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  sync(@Req() req: AuthedReq) {
    return this.runtime.sync({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('snapshots')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  snapshot(@Req() req: AuthedReq, @Body() body: { label?: string }) {
    return this.runtime.createSnapshot({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Get('snapshots')
  @UseGuards(TranslateAuthGuard)
  listSnapshots(@Req() req: AuthedReq) {
    return this.runtime.listSnapshots({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.runtime.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.runtime.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }
}
