import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ContextEngineService } from './context-engine.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/context-engine')
export class ContextEngineController {
  constructor(private readonly contextEngine: ContextEngineService) {}

  @Get('engine')
  engine {
    return this.contextEngine.engine;
  }

  @Get('sources')
  sources {
    return this.contextEngine.sources;
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.contextEngine.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.contextEngine.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Post('assemble')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  assemble(
    @Req req: AuthedReq,
    @Body
    body: {
      query?: string;
      conversationId?: string;
      projectKey?: string;
      subjectUserId?: string;
      promptKey?: 'chat' | 'rag';
      include?: {
        conversation?: boolean;
        documents?: boolean;
        organization?: boolean;
        project?: boolean;
        language?: boolean;
        user?: boolean;
        workspace?: boolean;
        historical?: boolean;
        knowledgeGraph?: boolean;
        prompt?: boolean;
      };
      maxChars?: number;
      documentK?: number;
      memoryLimit?: number;
    },
  ) {
    return this.contextEngine.assemble({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      query: body.query,
      conversationId: body.conversationId,
      projectKey: body.projectKey,
      subjectUserId: body.subjectUserId,
      promptKey: body.promptKey,
      include: body.include,
      maxChars: body.maxChars,
      documentK: body.documentK,
      memoryLimit: body.memoryLimit,
    });
  }
}
