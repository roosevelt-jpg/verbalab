import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { MemoryCloudService } from './memory-cloud.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/memory-cloud')
export class MemoryCloudController {
  constructor(private readonly memoryCloud: MemoryCloudService) {}

  @Get('engine')
  engine {
    return this.memoryCloud.engine;
  }

  @Get('scopes')
  scopes {
    return this.memoryCloud.scopes;
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.memoryCloud.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.memoryCloud.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('memories')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req req: AuthedReq,
    @Query('scope') scope?: string,
    @Query('kind') kind?: string,
    @Query('subjectUserId') subjectUserId?: string,
    @Query('conversationId') conversationId?: string,
    @Query('projectKey') projectKey?: string,
    @Query('agentId') agentId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.memoryCloud.list({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      scope,
      kind,
      subjectUserId,
      conversationId,
      projectKey,
      agentId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('memories/:id')
  @UseGuards(TranslateAuthGuard)
  get(@Req req: AuthedReq, @Param('id') id: string) {
    return this.memoryCloud.get({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Post('memories')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  create(
    @Req req: AuthedReq,
    @Body
    body: {
      scope?: string;
      kind?: string;
      content?: string;
      key?: string;
      subjectUserId?: string;
      agentId?: string;
      projectKey?: string;
      conversationId?: string;
      metadata?: Record<string, unknown>;
      expiresAt?: string | null;
      ttlSeconds?: number;
    },
  ) {
    return this.memoryCloud.create({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      scope: body.scope ?? 'workspace',
      kind: body.kind ?? 'long_term',
      content: body.content ?? '',
      key: body.key,
      subjectUserId: body.subjectUserId,
      agentId: body.agentId,
      projectKey: body.projectKey,
      conversationId: body.conversationId,
      metadata: body.metadata,
      expiresAt: body.expiresAt,
      ttlSeconds: body.ttlSeconds,
    });
  }

  @Post('memories/:id/revise')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  revise(
    @Req req: AuthedReq,
    @Param('id') id: string,
    @Body body: { content?: string; metadata?: Record<string, unknown> },
  ) {
    return this.memoryCloud.revise({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      content: body.content ?? '',
      metadata: body.metadata,
    });
  }

  @Delete('memories/:id')
  @UseGuards(TranslateAuthGuard)
  deleteOne(@Req req: AuthedReq, @Param('id') id: string) {
    return this.memoryCloud.deleteOne({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
    });
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  search(
    @Req req: AuthedReq,
    @Body
    body: { query?: string; scope?: string; kind?: string; subjectUserId?: string; limit?: number },
  ) {
    return this.memoryCloud.search({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      query: body.query ?? '',
      scope: body.scope,
      kind: body.kind,
      subjectUserId: body.subjectUserId,
      limit: body.limit,
    });
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  export(
    @Req req: AuthedReq,
    @Body body: { subjectUserId?: string },
  ) {
    return this.memoryCloud.export({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      subjectUserId: body.subjectUserId,
    });
  }

  @Post('erase')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  erase(
    @Req req: AuthedReq,
    @Body body: { subjectUserId?: string; confirm?: boolean; hard?: boolean },
  ) {
    return this.memoryCloud.erase({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      subjectUserId: body.subjectUserId,
      confirm: Boolean(body.confirm),
      hard: body.hard,
    });
  }
}
