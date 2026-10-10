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
import { TmService } from './tm.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';

@Controller('v1/tm')
export class TmHubController {
  constructor(private readonly tm: TmService) {}

  @Get()
  intelligence() {
    return this.tm.intelligence();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  analytics(
    @Req()
    req: Request & { translateAuth: TranslateAuthContext },
  ) {
    return this.tm.analytics(req.translateAuth.organizationId);
  }

  @Get('terminology')
  @UseGuards(ClerkAuthGuard)
  terminology(@CurrentSession() session: SessionContext) {
    return this.tm.terminology(session.organizationId, session.workspaceId);
  }

  @Get('history')
  @UseGuards(ClerkAuthGuard)
  history(
    @CurrentSession() session: SessionContext,
    @Query('entryId') entryId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tm.history(session.organizationId, session.workspaceId, {
      entryId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  search(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body()
    body: {
      text?: string;
      sourceLang?: string;
      targetLang?: string;
      projectKey?: string;
      mode?: 'lexical' | 'vector' | 'auto';
      limit?: number;
      minScore?: number;
    },
  ) {
    if (typeof body.text !== 'string' || !body.text.trim()) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if (!body.sourceLang?.trim() || !body.targetLang?.trim()) {
      throw new ApiException(
        'validation_error',
        'sourceLang and targetLang are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.tm.search({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      sourceLang: body.sourceLang.trim(),
      targetLang: body.targetLang.trim(),
      text: body.text,
      projectKey: body.projectKey,
      mode: body.mode,
      limit: body.limit,
      minScore: body.minScore,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}

@Controller('v1/tm/entries')
@UseGuards(ClerkAuthGuard)
export class TmController {
  constructor(private readonly tm: TmService) {}

  @Get()
  list(
    @CurrentSession() session: SessionContext,
    @Query('source') source?: string,
    @Query('target') target?: string,
    @Query('scope') scope?: string,
    @Query('projectKey') projectKey?: string,
  ) {
    return this.tm.list(session.organizationId, session.workspaceId, {
      source,
      target,
      scope,
      projectKey,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body()
    body: {
      sourceLang?: string;
      targetLang?: string;
      sourceText?: string;
      targetText?: string;
      scope?: string;
      projectKey?: string;
    },
  ) {
    return this.tm.upsertApproved({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      sourceLang: body.sourceLang ?? '',
      targetLang: body.targetLang ?? '',
      sourceText: body.sourceText ?? '',
      targetText: body.targetText ?? '',
      scope: body.scope,
      projectKey: body.projectKey,
      ip: clientIp(req),
    });
  }

  @Get(':id/versions')
  versions(@CurrentSession() session: SessionContext, @Param('id') id: string) {
    return this.tm.versions(session.organizationId, id);
  }

  @Delete(':id')
  remove(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.tm.remove(session.organizationId, id, {
      userId: session.userId,
      ip: clientIp(req),
    });
  }
}
