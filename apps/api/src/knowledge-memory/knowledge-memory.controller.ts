import {
  Body,
  Controller,
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
import { KnowledgeMemoryService } from './knowledge-memory.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/knowledge-memory')
export class KnowledgeMemoryController {
  constructor(private readonly knowledgeMemory: KnowledgeMemoryService) {}

  @Get('engine')
  engine() {
    return this.knowledgeMemory.engine();
  }

  @Get('scopes')
  scopes() {
    return this.knowledgeMemory.scopes();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.knowledgeMemory.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.knowledgeMemory.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('memories')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req() req: AuthedReq,
    @Query('scope') scope?: string,
    @Query('subjectUserId') subjectUserId?: string,
    @Query('conversationId') conversationId?: string,
    @Query('documentId') documentId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.knowledgeMemory.list({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      scope,
      subjectUserId,
      conversationId,
      documentId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('memories/:id')
  @UseGuards(TranslateAuthGuard)
  get(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.knowledgeMemory.get({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Get('memories/:id/versions')
  @UseGuards(TranslateAuthGuard)
  versions(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.knowledgeMemory.versions({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Post('memories')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  create(
    @Req() req: AuthedReq,
    @Body()
    body: {
      scope?: string;
      kind?: string;
      content?: string;
      key?: string;
      subjectUserId?: string;
      agentId?: string;
      conversationId?: string;
      documentId?: string;
      metadata?: Record<string, unknown>;
      expiresAt?: string | null;
      ttlSeconds?: number;
    },
  ) {
    return this.knowledgeMemory.create({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('memories/:id/evolve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  evolve(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { content?: string; reason?: string },
  ) {
    return this.knowledgeMemory.evolve({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      content: body.content,
      reason: body.reason,
    });
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  search(
    @Req() req: AuthedReq,
    @Body()
    body: { query?: string; scope?: string; documentId?: string; limit?: number },
  ) {
    return this.knowledgeMemory.search({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      query: body.query,
      scope: body.scope,
      documentId: body.documentId,
      limit: body.limit,
    });
  }
}
