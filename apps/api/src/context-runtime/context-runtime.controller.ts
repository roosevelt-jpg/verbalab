import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ContextRuntimeService } from './context-runtime.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/context-runtime')
export class ContextRuntimeController {
  constructor(private readonly runtime: ContextRuntimeService) {}

  @Get('engine')
  engine {
    return this.runtime.engine;
  }

  @Get('scopes')
  scopes {
    return this.runtime.scopes;
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

  @Post('assemble')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  assemble(
    @Req req: AuthedReq,
    @Body
    body: {
      query?: string;
      conversationId?: string;
      projectKey?: string;
      subjectUserId?: string;
      promptKey?: 'chat' | 'rag';
      modelHint?: string;
      providerHint?: string;
      include?: Record<string, boolean>;
      maxChars?: number;
      documentK?: number;
      memoryLimit?: number;
      useCache?: boolean;
      priorityOverrides?: Record<string, number>;
    },
  ) {
    return this.runtime.assemble({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('retrieve')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  retrieve(
    @Req req: AuthedReq,
    @Body
    body: {
      query?: string;
      conversationId?: string;
      projectKey?: string;
      subjectUserId?: string;
      promptKey?: 'chat' | 'rag';
      modelHint?: string;
      providerHint?: string;
      include?: Record<string, boolean>;
      maxChars?: number;
      useCache?: boolean;
      priorityOverrides?: Record<string, number>;
    },
  ) {
    return this.runtime.retrieve({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('prioritize')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  prioritize(
    @Req req: AuthedReq,
    @Body
    body: {
      blocks?: Array<{
        id: string;
        kind: string;
        priority: number;
        content: string;
        chars: number;
        truncated?: boolean;
      }>;
      priorityOverrides?: Record<string, number>;
      maxChars?: number;
    },
  ) {
    return this.runtime.prioritize({
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
  compress(
    @Req req: AuthedReq,
    @Body
    body: {
      blocks?: Array<{
        id: string;
        kind: string;
        priority: number;
        content: string;
        chars: number;
        truncated?: boolean;
      }>;
      text?: string;
      maxChars?: number;
      priorityOverrides?: Record<string, number>;
    },
  ) {
    return this.runtime.compress({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }
}
